from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import Material, Tag
from .serializers import (
    MaterialSerializer,
    MaterialUploadSerializer,
    MaterialDetailSerializer,
    TagSerializer,
)
from .parser import parse_docx


class MaterialListCreateView(APIView):
    """
    GET  /api/materials/       → list all materials
    POST /api/materials/       → upload a new .docx and trigger parsing
    """
    parser_classes = [MultiPartParser, JSONParser]

    def get(self, request):
        materials = Material.objects.filter(user=request.user)
        tag_id = request.query_params.get('tag_id')
        if tag_id:
            materials = materials.filter(tags__id=tag_id)
        serializer = MaterialSerializer(materials, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = MaterialUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # 1. Save the material record and the uploaded file
        material = serializer.save(user=request.user, status=Material.Status.PARSING)

        # 2. Parse the .docx synchronously (async/Celery comes later)
        try:
            block_count = parse_docx(material)
            material.status = Material.Status.READY
            material.save(update_fields=['status'])
        except Exception as exc:
            material.status = Material.Status.FAILED
            material.save(update_fields=['status'])
            return Response(
                {'detail': f'Parsing failed: {exc}'},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        return Response(
            {
                'id': str(material.id),
                'title': material.title,
                'status': material.status,
                'blocks_created': block_count,
            },
            status=status.HTTP_201_CREATED,
        )


class MaterialDetailView(APIView):
    """
    GET /api/materials/<uuid:pk>/   → return material + all blocks (flat array)
    DELETE /api/materials/<uuid:pk>/ → delete material and all its blocks
    """

    def _get_material(self, pk, user):
        try:
            return Material.objects.get(pk=pk, user=user)
        except Material.DoesNotExist:
            return None

    def get(self, request, pk):
        material = self._get_material(pk, request.user)
        if not material:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = MaterialDetailSerializer(material, context={'request': request})
        return Response(serializer.data)

    def patch(self, request, pk):
        material = self._get_material(pk, request.user)
        if not material:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        title = request.data.get('title')
        if title:
            material.title = title
            material.save(update_fields=['title'])
            return Response({'detail': 'Material updated', 'title': title})
            
        return Response({'detail': 'No title provided'}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        material = self._get_material(pk, request.user)
        if not material:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        material.delete()   # cascades to all Blocks
        return Response(status=status.HTTP_204_NO_CONTENT)


class TagListCreateView(generics.ListCreateAPIView):
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from django.db.models import Count
        return Tag.objects.filter(user=self.request.user)\
                          .annotate(mat_count=Count('materials'))\
                          .order_by('-mat_count', 'name')

    def create(self, request, *args, **kwargs):
        name = request.data.get('name', '').strip()
        if not name:
            return Response({'detail': 'Tag name is required.'}, status=400)
        tag, created = Tag.objects.get_or_create(user=request.user, name=name)
        return Response(TagSerializer(tag).data, status=201 if created else 200)


class TagDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        """Rename a tag. Body: { name: string }"""
        tag = get_object_or_404(Tag, pk=pk, user=request.user)
        name = request.data.get('name', '').strip()
        if not name:
            return Response({'detail': 'Name required.'}, status=400)
        tag.name = name
        tag.save(update_fields=['name'])
        return Response(TagSerializer(tag).data)

    def delete(self, request, pk):
        """Delete a tag globally; cascades via MaterialTag FK."""
        tag = get_object_or_404(Tag, pk=pk, user=request.user)
        affected = list(tag.materials.values('id', 'title'))
        tag.delete()
        return Response({'deleted': True, 'affected_materials': affected})


class MaterialTagView(APIView):
    """Add or remove a tag from a material."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        """Add tag to material. Body: { tag_id: UUID } OR { tag_name: string }"""
        material = get_object_or_404(Material, pk=pk, user=request.user)
        if material.tags.count() >= 5:
            return Response({'detail': 'Maximum 5 tags per material.'}, status=400)

        tag_id   = request.data.get('tag_id')
        tag_name = request.data.get('tag_name', '').strip()

        if tag_id:
            tag = get_object_or_404(Tag, pk=tag_id, user=request.user)
        elif tag_name:
            tag, _ = Tag.objects.get_or_create(user=request.user, name=tag_name)
        else:
            return Response({'detail': 'Provide tag_id or tag_name.'}, status=400)

        material.tags.add(tag)
        return Response(TagSerializer(tag).data, status=200)

    def delete(self, request, pk, tag_id):
        """Remove a tag from a material."""
        material = get_object_or_404(Material, pk=pk, user=request.user)
        tag      = get_object_or_404(Tag, pk=tag_id, user=request.user)
        material.tags.remove(tag)
        return Response(status=204)


class ReadingProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        material      = get_object_or_404(Material, pk=pk, user=request.user)
        percent       = request.data.get('percent', 0)
        last_block_id = request.data.get('last_block_id')
        
        # Need to import ReadingProgress
        from .models import ReadingProgress
        prog, _ = ReadingProgress.objects.update_or_create(
            user=request.user,
            material=material,
            defaults={'percent': percent, 'last_block_id': last_block_id}
        )
        return Response({'percent': prog.percent})


class MaterialSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response([])

        from rapidfuzz import fuzz
        materials = Material.objects.filter(user=request.user).prefetch_related('tags')

        scored = []
        for m in materials:
            tag_names  = ' '.join(t.name for t in m.tags.all())
            searchable = f"{m.title} {tag_names}"
            score      = fuzz.WRatio(query, searchable)
            if score >= 50:
                scored.append((m, score))

        scored.sort(key=lambda x: x[1], reverse=True)
        results    = [m for m, _ in scored]
        serializer = MaterialSerializer(results, many=True, context={'request': request})
        return Response(serializer.data)
