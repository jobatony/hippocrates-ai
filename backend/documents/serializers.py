from rest_framework import serializers
from .models import Material, Block


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

    class Meta:
        model  = Material
        fields = ['id', 'title', 'status', 'created_at']
        read_only_fields = ['id', 'status', 'created_at']


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
    blocks = BlockSerializer(many=True, read_only=True)

    class Meta:
        model  = Material
        fields = ['id', 'title', 'status', 'created_at', 'blocks']
