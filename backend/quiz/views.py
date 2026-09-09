from django.db import transaction
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from documents.models import Block, Material
from .models import Question
from .context_builder import build_heading2_context
from .ai_service import generate_question, GenerationValidationError
from .serializers import QuestionSerializer

class GenerateQuestionView(APIView):
    def post(self, request):
        block_id = request.data.get('block_id')
        question_type = request.data.get('question_type')
        material_id = request.data.get('material_id')
        selected_text = request.data.get('selected_text')

        if not block_id or not question_type or not material_id or not selected_text:
            return Response({'detail': f'Missing required fields. Received: block_id={block_id}, type={question_type}, material={material_id}, text={selected_text}'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            block = Block.objects.get(id=block_id)
            material = Material.objects.get(id=material_id, user=request.user)
        except (Block.DoesNotExist, Material.DoesNotExist):
            return Response({'detail': 'Block or Material not found or permission denied'}, status=status.HTTP_404_NOT_FOUND)

        # Atomic check for the 20 pending questions cap
        with transaction.atomic():
            pending_count = Question.objects.select_for_update().filter(
                material=material, status=Question.Status.PENDING
            ).count()
            
            if pending_count >= 20:
                return Response({'detail': 'You have 20 pending questions. Please review them before generating more.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)

            context_string, heading_2_block = build_heading2_context(block)

            try:
                payload, prompt_sent, raw_response = generate_question(question_type, selected_text, context_string)
            except ValueError as e:
                return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            except GenerationValidationError as e:
                return Response({'detail': f'AI generation failed to produce valid structure: {str(e)}'}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

            question = Question.objects.create(
                material=material,
                source_block=block,
                heading_2_block=heading_2_block,
                question_type=question_type,
                status=Question.Status.PENDING,
                selected_text=selected_text,
                payload=payload,
                prompt_sent=prompt_sent,
                raw_ai_response=raw_response
            )

        serializer = QuestionSerializer(question)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class RegenerateQuestionView(APIView):
    def post(self, request, pk):
        extra_instruction = request.data.get('extra_instruction', '')

        try:
            question = Question.objects.get(pk=pk, material__user=request.user)
        except Question.DoesNotExist:
            return Response({'detail': 'Question not found'}, status=status.HTTP_404_NOT_FOUND)

        # Re-build context fresh from the database
        context_string, _ = build_heading2_context(question.source_block)

        # Send existing payload to the AI so it knows what it did wrong
        current_bad_output = str(question.payload)
        correction_prompt = f"Previous output was:\n{current_bad_output}\n\nCorrection needed: {extra_instruction}"

        try:
            new_payload, new_prompt_sent, new_raw_response = generate_question(
                question.question_type, 
                question.selected_text, 
                context_string, 
                extra_instruction=correction_prompt
            )
        except GenerationValidationError as e:
            return Response({'detail': f'AI regeneration failed: {str(e)}'}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        # Update the existing record instead of creating a new one
        question.payload = new_payload
        question.prompt_sent = new_prompt_sent
        question.raw_ai_response = new_raw_response
        question.status = Question.Status.PENDING
        question.save()

        serializer = QuestionSerializer(question)
        return Response(serializer.data, status=status.HTTP_200_OK)


class QuestionDetailView(APIView):
    def patch(self, request, pk):
        """Allows inline manual editing of the payload, or approving a question"""
        try:
            question = Question.objects.get(pk=pk, material__user=request.user)
        except Question.DoesNotExist:
            return Response({'detail': 'Question not found'}, status=status.HTTP_404_NOT_FOUND)

        payload_update = request.data.get('payload')
        status_update = request.data.get('status')

        if payload_update:
            # We trust the frontend editor to maintain schema structure, 
            # but ideally we'd re-validate against Pydantic here.
            question.payload = payload_update
        
        if status_update in [choice[0] for choice in Question.Status.choices]:
            question.status = status_update

        question.save()
        serializer = QuestionSerializer(question)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        try:
            question = Question.objects.get(pk=pk, material__user=request.user)
        except Question.DoesNotExist:
            return Response({'detail': 'Question not found'}, status=status.HTTP_404_NOT_FOUND)
            
        question.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class QuestionListView(APIView):
    def get(self, request):
        material_id = request.query_params.get('material_id')
        if not material_id:
            return Response({'detail': 'material_id query parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        questions = Question.objects.filter(material_id=material_id, material__user=request.user).order_by('-created_at')
        serializer = QuestionSerializer(questions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LogAttemptView(APIView):
    """Logs a single review attempt. Called by the frontend after each Check Answer."""
    def post(self, request):
        from django.shortcuts import get_object_or_404
        from .models import ReviewAttempt
        
        question_id = request.data.get('question_id')
        user_answer = request.data.get('user_answer', {})
        is_correct = request.data.get('is_correct')

        question = get_object_or_404(Question, pk=question_id, material__user=request.user)

        attempt = ReviewAttempt.objects.create(
            question=question,
            material=question.material,
            user_answer=user_answer,
            is_correct=is_correct,
        )
        return Response({'id': str(attempt.id)}, status=status.HTTP_201_CREATED)
