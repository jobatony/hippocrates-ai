from rest_framework import serializers
from .models import Question

class QuestionSerializer(serializers.ModelSerializer):
    material_id = serializers.UUIDField(source='material.id', read_only=True)
    block_id = serializers.UUIDField(source='source_block.id', read_only=True)

    class Meta:
        model = Question
        fields = [
            'id', 'material_id', 'block_id', 'question_type', 
            'status', 'selected_text', 'payload', 
            'prompt_sent', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'prompt_sent']
