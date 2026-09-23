from rest_framework import serializers
from .models import Material, Block, Tag

class TagSerializer(serializers.ModelSerializer):
    material_count = serializers.SerializerMethodField()

    class Meta:
        model  = Tag
        fields = ['id', 'name', 'material_count', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_material_count(self, obj):
        return obj.materials.count()

class BlockSerializer(serializers.ModelSerializer):
    """
    Flat serializer — sends parent_id so the React frontend can
    reconstruct the tree client-side (adjacency list pattern).
    """
    parent_id = serializers.UUIDField(source='parent.id', allow_null=True, read_only=True)

    class Meta:
        model  = Block
        fields = ['id', 'parent_id', 'order', 'block_type', 'text']


class MaterialSerializer(serializers.ModelSerializer):
    """Used for listing materials (no blocks embedded)."""
    tags             = TagSerializer(many=True, read_only=True)
    question_count   = serializers.SerializerMethodField()
    reading_progress = serializers.SerializerMethodField()

    class Meta:
        model  = Material
        fields = ['id', 'title', 'status', 'created_at', 'tags', 'question_count', 'reading_progress']
        read_only_fields = ['id', 'status', 'created_at']

    def get_question_count(self, obj):
        return obj.questions.filter(status='approved').count()

    def get_reading_progress(self, obj):
        request = self.context.get('request')
        if not request:
            return 0
        prog = obj.progress.filter(user=request.user).first()
        return prog.percent if prog else 0


class MaterialUploadSerializer(serializers.ModelSerializer):
    """Used for the POST /materials/ upload endpoint."""

    class Meta:
        model  = Material
        fields = ['id', 'title', 'file']
        read_only_fields = ['id']


class MaterialDetailSerializer(serializers.ModelSerializer):
    """
    Returns the material metadata + all its blocks as a flat array.
    React reconstructs the tree using parent_id references.
    """
    blocks        = BlockSerializer(many=True, read_only=True)
    last_block_id = serializers.SerializerMethodField()

    class Meta:
        model  = Material
        fields = ['id', 'title', 'status', 'created_at', 'blocks', 'last_block_id']

    def get_last_block_id(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        prog = obj.progress.filter(user=request.user).first()
        return str(prog.last_block_id) if prog and prog.last_block_id else None
