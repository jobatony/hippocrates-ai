from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, JSONParser

from .models import Material
from .serializers import (
    MaterialSerializer,
    MaterialUploadSerializer,
    MaterialDetailSerializer,
)
from .parser import parse_docx


class MaterialListCreateView(APIView):
    """
    GET  /api/materials/       → list all materials
    POST /api/materials/       → upload a new .docx and trigger parsing
    """
    parser_classes = [MultiPartParser, JSONParser]

    def get(self, request):
        materials = Material.objects.all()
        serializer = MaterialSerializer(materials, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = MaterialUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # 1. Save the material record and the uploaded file
        material = serializer.save(status=Material.Status.PARSING)

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

    def _get_material(self, pk):
        try:
            return Material.objects.get(pk=pk)
        except Material.DoesNotExist:
            return None

    def get(self, request, pk):
        material = self._get_material(pk)
        if not material:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = MaterialDetailSerializer(material)
        return Response(serializer.data)

    def delete(self, request, pk):
        material = self._get_material(pk)
        if not material:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        material.delete()   # cascades to all Blocks
        return Response(status=status.HTTP_204_NO_CONTENT)
