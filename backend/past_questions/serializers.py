from rest_framework import serializers
from .models import Exam, Subject, PastQuestion, QuestionOption

class ExamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exam
        fields = ['id', 'name']

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name']

class QuestionOptionSerializer(serializers.ModelSerializer):
    is_correct = serializers.BooleanField(required=False, allow_null=True, default=None)

    class Meta:
        model = QuestionOption
        fields = ['id', 'letter', 'text', 'is_correct']

class PastQuestionSerializer(serializers.ModelSerializer):
    options = QuestionOptionSerializer(many=True)
    exam_name = serializers.CharField(source='exam.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)

    class Meta:
        model = PastQuestion
        fields = [
            'id', 'exam', 'exam_name', 'subject', 'subject_name', 'year', 'number', 
            'question_text', 'has_diagram', 'image', 'status', 'validator_feedback', 
            'options', 'created_at', 'updated_at'
        ]
        read_only_fields = ['status', 'validator_feedback']

    def validate_question_text(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Question text cannot be empty.")
        return value

    def validate_options(self, value):
        non_empty = [opt for opt in value if opt.get('text', '').strip()]
        if len(non_empty) < 2:
            raise serializers.ValidationError("A minimum of two non-empty options is required.")
        return value

    def create(self, validated_data):
        options_data = validated_data.pop('options')
        question = PastQuestion.objects.create(**validated_data)
        for option_data in options_data:
            QuestionOption.objects.create(question=question, **option_data)
        return question

    def update(self, instance, validated_data):
        options_data = validated_data.pop('options', None)
        
        # Update question fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # If the status is changes_requested, interacting with it reverts it to pending
        if instance.status == 'changes_requested':
            instance.status = 'pending'
            
        instance.save()

        # Update options if provided
        if options_data is not None:
            instance.options.all().delete()
            for option_data in options_data:
                QuestionOption.objects.create(question=instance, **option_data)
                
        return instance
