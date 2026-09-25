import random
from datetime import timedelta

from django.db import transaction
from django.db.models import Count
from django.db.models.functions import TruncDate
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from documents.models import Block, Material
from .models import Question, QuestionSchedule, DailyStudyLog
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
            # If changing to APPROVED, schedule it for tomorrow
            if status_update == Question.Status.APPROVED and question.status != Question.Status.APPROVED:
                QuestionSchedule.objects.get_or_create(
                    question=question,
                    user=request.user,
                    defaults={'scheduled_date': timezone.now().date() + timedelta(days=1)}
                )
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


# ─── Dashboard ────────────────────────────────────────────────────────────────

class DashboardStatsView(APIView):
    def get(self, request):
        user = request.user
        today = timezone.now().date()

        # Today's log (may not exist yet if no reviews done today)
        today_log = DailyStudyLog.objects.filter(user=user, date=today).first()
        reviewed_today = today_log.reviewed if today_log else 0
        created_today  = today_log.created  if today_log else 0
        
        REVIEW_STREAK_MINIMUM = 120
        CREATION_STREAK_MINIMUM = 50

        # Current month's activity
        start_of_month = today.replace(day=1)
        if start_of_month.month == 12:
            end_of_month = start_of_month.replace(year=start_of_month.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end_of_month = start_of_month.replace(month=start_of_month.month + 1, day=1) - timedelta(days=1)

        logs = {
            log.date: log
            for log in DailyStudyLog.objects.filter(
                user=user, date__range=(start_of_month, end_of_month)
            )
        }

        monthly_activity = []
        current_date = start_of_month
        while current_date <= end_of_month:
            log = logs.get(current_date)
            monthly_activity.append({
                'date':     current_date.strftime('%Y-%m-%d'),
                'reviewed': log.reviewed if log else 0,
                'created':  log.created  if log else 0,
                'review_streak_met': log.review_streak_met if log else False,
                'creation_streak_met': log.creation_streak_met if log else False,
            })
            current_date += timedelta(days=1)

        # Review Streak
        current_review_streak = 0
        check_date = today
        if not (today_log and today_log.review_streak_met):
            check_date = today - timedelta(days=1)
        while True:
            if DailyStudyLog.objects.filter(user=user, date=check_date, review_streak_met=True).exists():
                current_review_streak += 1
                check_date -= timedelta(days=1)
            else:
                break

        # Creation Streak
        current_creation_streak = 0
        check_date = today
        if not (today_log and today_log.creation_streak_met):
            check_date = today - timedelta(days=1)
        while True:
            if DailyStudyLog.objects.filter(user=user, date=check_date, creation_streak_met=True).exists():
                current_creation_streak += 1
                check_date -= timedelta(days=1)
            else:
                break

        # Longest Review Streak
        all_review_days = list(DailyStudyLog.objects.filter(user=user, review_streak_met=True).order_by('date').values_list('date', flat=True))
        longest_review_streak = 0
        curr_len = 0
        for i, d in enumerate(all_review_days):
            if i > 0 and (d - all_review_days[i - 1]).days == 1:
                curr_len += 1
            else:
                curr_len = 1
            longest_review_streak = max(longest_review_streak, curr_len)
        longest_review_streak = max(longest_review_streak, current_review_streak)
        
        # Longest Creation Streak
        all_creation_days = list(DailyStudyLog.objects.filter(user=user, creation_streak_met=True).order_by('date').values_list('date', flat=True))
        longest_creation_streak = 0
        curr_len = 0
        for i, d in enumerate(all_creation_days):
            if i > 0 and (d - all_creation_days[i - 1]).days == 1:
                curr_len += 1
            else:
                curr_len = 1
            longest_creation_streak = max(longest_creation_streak, curr_len)
        longest_creation_streak = max(longest_creation_streak, current_creation_streak)

        # Due cards count
        due_count = QuestionSchedule.objects.filter(
            user=user, scheduled_date__lte=today, mastered_at__date__lt=today
        ).count() + QuestionSchedule.objects.filter(
            user=user, scheduled_date__lte=today, mastered_at__isnull=True
        ).count()

        cards_mastered_today = QuestionSchedule.objects.filter(user=user, mastered_at__date=today).count()

        return Response({
            "reviewed_today":  reviewed_today,
            "review_streak_minimum": REVIEW_STREAK_MINIMUM,
            "review_streak_met": today_log.review_streak_met if today_log else False,
            "created_today":   created_today,
            "creation_streak_minimum": CREATION_STREAK_MINIMUM,
            "creation_streak_met": today_log.creation_streak_met if today_log else False,
            "current_review_streak":  current_review_streak,
            "current_creation_streak":  current_creation_streak,
            "longest_review_streak":  longest_review_streak,
            "longest_creation_streak": longest_creation_streak,
            "monthly_activity": monthly_activity,
            "due_count":       due_count,
            "cards_mastered_today": cards_mastered_today,
        })


# ─── Quiz Session ─────────────────────────────────────────────────────────────

def _card_from_schedule(schedule: QuestionSchedule) -> dict:
    """Serialise a QuestionSchedule into a quiz card dict for the frontend."""
    q = schedule.question
    tag = q.material.tags.first()
    return {
        "id":               str(q.id),
        "question_type":    q.question_type,
        "material_title":   q.material.title,
        "topic":            tag.name if tag else "General",
        "payload":          q.payload,
        "streak":           schedule.streak,
        "review_count":     schedule.review_count,
        "scheduled_date":   schedule.scheduled_date.isoformat() if schedule.scheduled_date else None,
        "mastery_dots":     min(schedule.streak, 3),
        "mastery_required": 3,
        "availableAt":      int(schedule.available_at.timestamp() * 1000) if schedule.available_at else 0,
    }


REVIEW_STREAK_MINIMUM = 120
SLOT_SIZE = 100

class QuizSessionView(APIView):
    def get(self, request):
        user = request.user
        today = timezone.now().date()

        # 1. Pull all eligible cards
        eligible_qs = QuestionSchedule.objects.filter(
            user=user,
            scheduled_date__lte=today
        ).exclude(mastered_at__date=today).select_related('question__material').order_by('scheduled_date')
        
        all_eligible = list(eligible_qs)
        
        # Reset streak for cards mastered on previous days returning to the queue
        for s in all_eligible:
            if s.mastered_at and s.mastered_at.date() < today:
                s.streak = 0
                s.mastered_at = None
                s.available_at = None
                s.save(update_fields=['streak', 'mastered_at', 'available_at'])

        # 2. Quota-based Selection
        new_cards = [s for s in all_eligible if s.review_count == 0]
        young_cards = [s for s in all_eligible if 0 < s.review_count <= 3]
        mature_cards = [s for s in all_eligible if s.review_count > 3]
        
        target_total = 30
        quota_new = int(target_total * 0.40) # 12
        quota_young = int(target_total * 0.35) # 10
        quota_mature = target_total - quota_new - quota_young # 8
        
        def take(pool, count):
            return pool[:count], pool[count:]
            
        selected_new, rem_new = take(new_cards, quota_new)
        selected_young, rem_young = take(young_cards, quota_young)
        selected_mature, rem_mature = take(mature_cards, quota_mature)
        
        shortfall = target_total - (len(selected_new) + len(selected_young) + len(selected_mature))
        if shortfall > 0:
            remaining = rem_new + rem_young + rem_mature
            remaining.sort(key=lambda s: s.scheduled_date)
            selected_extra, _ = take(remaining, shortfall)
            primary = selected_new + selected_young + selected_mature + selected_extra
        else:
            primary = selected_new + selected_young + selected_mature
            
        # Optional: you can sort primary again if you want them mixed by scheduled_date
        # primary.sort(key=lambda s: s.scheduled_date)

        # 3. Session Progress tracking
        # We track how many unique cards were mastered *today* for the progress bar.
        cards_mastered_today = QuestionSchedule.objects.filter(user=user, mastered_at__date=today).count()
        # session_total dynamically reflects the full backlog, or just the current session plus completed
        # If backlog is huge, it shows exactly what you must do today (all_eligible + mastered).
        session_total = len(all_eligible) + cards_mastered_today
        
        if session_total == 0:
            return Response({"session_total": 0, "completed": 0, "queue": []})

        queue = [_card_from_schedule(s) for s in primary]

        return Response({
            "session_total": session_total,
            "completed":     cards_mastered_today,
            "queue":         queue,
        })


class QuizSessionAnswerView(APIView):
    def post(self, request, pk):
        from .srs import find_next_review_date
        
        correct = request.data.get('correct')
        user = request.user
        today = timezone.now().date()
        
        if correct is None:
             return Response(
                {'detail': 'Invalid payload. Must provide boolean "correct".'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            schedule = QuestionSchedule.objects.get(question_id=pk, user=user)
        except QuestionSchedule.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if correct:
            schedule.streak += 1
        else:
            schedule.streak = 0

        schedule.last_reviewed = timezone.now()

        mastered = schedule.streak >= 3
        if mastered:
            schedule.mastered_at = timezone.now()
            # Pass the current review_count BEFORE we increment it, so the first mastery is 0, second is 1, etc.
            # Or pass it after incrementing? 
            # If "first 3 reviews" means the first 3 times they review it (and master it).
            # Let's pass the current review_count. 
            schedule.scheduled_date = find_next_review_date(user, today, schedule.review_count)
            schedule.review_count += 1
            # Do NOT reset streak here. Wait until the card is pulled again on a future date.
            schedule.available_at = None
        else:
            # Set available_at based on correct/incorrect
            min_mins = 5 if correct else 3
            max_mins = 10 if correct else 5
            delay_mins = random.randint(min_mins, max_mins)
            schedule.available_at = timezone.now() + timedelta(minutes=delay_mins)

        schedule.save()

        # Update DailyStudyLog (upsert)
        if mastered:
            log, _ = DailyStudyLog.objects.get_or_create(user=user, date=today, defaults={'reviewed': 0, 'created': 0})
            # To be perfectly safe from double-counting if a bug allows mastering twice in one day,
            # we can just recount from the database, or assume +1 is safe because of queue exclusion.
            # Counting from DB is safest:
            cards_mastered_today = QuestionSchedule.objects.filter(user=user, mastered_at__date=today).count()
            log.reviewed = cards_mastered_today
            log.review_streak_met = log.reviewed >= REVIEW_STREAK_MINIMUM
            log.save(update_fields=['reviewed', 'review_streak_met'])

        return Response({
            "streak": schedule.streak,
            "mastered": mastered,
            "next_scheduled": schedule.scheduled_date.isoformat() if schedule.scheduled_date else None,
            "available_at": int(schedule.available_at.timestamp() * 1000) if schedule.available_at else 0
        })
