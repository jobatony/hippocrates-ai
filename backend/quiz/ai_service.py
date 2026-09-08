import json
import logging
import google.genai as genai
from google.genai import types
from django.conf import settings
from pydantic import ValidationError

from .schemas import MCQSchema, TrueFalseSchema, FillInSchema, AppliesSchema

logger = logging.getLogger(__name__)

# Initialize Gemini client using the new SDK
client = genai.Client(api_key=settings.GEMINI_API_KEY)

class GenerationValidationError(Exception):
    pass


def _normalize_mcq(data: dict) -> dict:
    """Coerce and clamp MCQ data before Pydantic validation."""
    if 'correct_index' in data:
        data['correct_index'] = int(data['correct_index'])
    if 'options' in data and isinstance(data['options'], list):
        if len(data['options']) > 5:
            data['options'] = data['options'][:5]
        if data.get('correct_index', 0) >= len(data['options']):
            data['correct_index'] = 0
    return data


def _normalize_fill_in(data: dict) -> dict:
    """Coerce and clean FillIn data before Pydantic validation."""
    if 'gap_count' in data:
        data['gap_count'] = int(data['gap_count'])

    gap_count = data.get('gap_count', 0)

    if 'answer_bank' in data and isinstance(data['answer_bank'], list):
        bank = data['answer_bank']
        target = gap_count * 2

        if len(bank) != target:
            correct_items = [o for o in bank if o.get('correct_for_gaps')]
            distractor_items = [o for o in bank if not o.get('correct_for_gaps')]
            combined = correct_items + distractor_items
            data['answer_bank'] = combined[:target]

    return data


def _normalize_true_false(data: dict) -> dict:
    """
    Rescue T/F responses where the model used alternative key names
    for the statements array, or where sub-fields are named differently.
    """
    # If 'statements' is missing, look for common alternative keys the model might use
    if 'statements' not in data or not data.get('statements'):
        for alt_key in ('pairs', 'items', 'facts', 'questions', 'clauses', 'entries'):
            if alt_key in data and isinstance(data[alt_key], list) and len(data[alt_key]) > 0:
                data['statements'] = data.pop(alt_key)
                break

    # Normalize each statement object — model may use different sub-field names
    if 'statements' in data and isinstance(data['statements'], list):
        normalized_statements = []
        for stmt in data['statements']:
            if not isinstance(stmt, dict):
                continue
            # Map alternative true-statement key names
            true_val = (
                stmt.get('true_statement')
                or stmt.get('true')
                or stmt.get('correct_statement')
                or stmt.get('fact')
                or stmt.get('true_fact')
            )
            # Map alternative false-statement key names
            false_val = (
                stmt.get('false_alternative')
                or stmt.get('false')
                or stmt.get('false_statement')
                or stmt.get('incorrect_statement')
                or stmt.get('distractor')
                or stmt.get('false_fact')
            )
            if true_val and false_val:
                normalized_statements.append({
                    'true_statement': true_val,
                    'false_alternative': false_val,
                })
        if normalized_statements:
            data['statements'] = normalized_statements

    return data


def generate_question(question_type: str, selected_text: str, context_string: str, extra_instruction: str = None) -> tuple:
    """
    Generates a question using Gemini structured output via the new google-genai SDK.
    Returns: (validated_payload_dict, prompt_sent, raw_response_text)
    Raises GenerationValidationError if it fails after retries.
    """
    schema_map = {
        'mcq': MCQSchema,
        'true_false': TrueFalseSchema,
        'fill_in': FillInSchema,
        'applies': AppliesSchema,
    }

    if question_type not in schema_map:
        raise ValueError(f"Unknown question_type: {question_type}")

    pydantic_schema = schema_map[question_type]

    base_prompt = f"""You are a Medical Education AI. Your task is to generate a {question_type} question based on the provided text.

CONTEXT (For background knowledge only, to ensure medical accuracy):
{context_string}

TARGET TEXT (The question MUST be specifically about this text):
<<SELECTED>>
{selected_text}
<</SELECTED>>

STRICT OUTPUT RULE: Return ONLY a valid JSON object. Do NOT include any reasoning, chain-of-thought, notes, commentary, explanations, or filler text anywhere in the output — not inside any field and not outside the JSON object. Your entire response must be the JSON object and nothing else.
"""

    type_instructions = {
        'mcq': (
            "Generate a multiple choice question with exactly 4 or 5 options. "
            "Ensure there is exactly one unequivocally correct answer and provide a brief educational explanation.\n"
            "You MUST return a JSON object with exactly FOUR fields: 'question', 'options', 'correct_index', 'explanation'.\n"
            "Example structure:\n"
            '{"question": "Which organism is responsible for causing malaria?", '
            '"options": ["Plasmodium falciparum", "Mycobacterium tuberculosis", "Treponema pallidum", "Candida albicans"], '
            '"correct_index": 0, '
            '"explanation": "Malaria is caused by Plasmodium protozoa, with P. falciparum being the most lethal species."}'
        ),
        'true_false': (
            "Generate a true/false cluster question. For each key fact in the target text, "
            "provide a true statement and a plausible but unequivocally false alternative. "
            "You MUST return a JSON object with exactly TWO fields:\n"
            "  1. 'stem' (string): an overarching question stem e.g. 'Concerning diabetes mellitus:'\n"
            "  2. 'statements' (array of objects): each object MUST have exactly two string fields:\n"
            "       - 'true_statement': a factually correct statement from the text\n"
            "       - 'false_alternative': a plausible but clearly false alternative\n"
            "Example structure:\n"
            '{"stem": "Concerning malaria:", "statements": ['
            '{"true_statement": "Malaria is caused by Plasmodium protozoa.", "false_alternative": "Malaria is caused by a bacterial infection."}, '
            '{"true_statement": "Transmission occurs via the female Anopheles mosquito.", "false_alternative": "Transmission occurs via direct human contact."}'
            "]}"
        ),
        'fill_in': (
            "Generate a fill-in-the-gap question. Select 2 to 5 key medical concepts from the target text and replace them with {gap_0}, {gap_1}, etc. "
            "(use single curly braces and 0-based numbering). "
            "IMPORTANT: A gap can be a single word OR a multi-word phrase — choose whichever best represents the key medical concept "
            "(e.g. 'female Anopheles mosquito', 'oxidative phosphorylation', or 'Plasmodium falciparum' are all valid gaps). "
            "Provide an answer bank where the total number of items is exactly twice the number of gaps: "
            "half are the correct answers (with their gap index in correct_for_gaps), half are plausible distractors (empty correct_for_gaps). "
            "Set gap_count to the exact number of gaps.\n"
            "Example structure (3 gaps):\n"
            '{"question_text": "Malaria is caused by {gap_0} and transmitted by the {gap_1}. It was first identified by {gap_2}.", '
            '"gap_count": 3, '
            '"answer_bank": ['
            '{"text": "Plasmodium protozoa", "correct_for_gaps": [0]}, '
            '{"text": "female Anopheles mosquito", "correct_for_gaps": [1]}, '
            '{"text": "Charles Laveran", "correct_for_gaps": [2]}, '
            '{"text": "Candida albicans", "correct_for_gaps": []}, '
            '{"text": "Aedes aegypti mosquito", "correct_for_gaps": []}, '
            '{"text": "Louis Pasteur", "correct_for_gaps": []}'
            "]}"
        ),
        'applies': (
            "Generate a 'Select all that apply' question based on the list items in the target text. "
            "All items from the given list are correct options. "
            "Generate at least 2 plausible distractor options that sound medically related but are NOT from the list. "
            "You MUST return a JSON object with exactly THREE fields: 'question', 'correct_options', 'wrong_options'.\n"
            "Example structure:\n"
            '{"question": "Clinical features of Diabetes Mellitus. Select all that apply:", '
            '"correct_options": ["Polyuria", "Polydipsia", "Polyphagia", "Obesity", "Foot Ulcer", "Tingling Sensation"], '
            '"wrong_options": ["Headache", "Oliguria", "Hematuria", "Fever"]}'
        ),
    }

    prompt = base_prompt + "\n" + type_instructions[question_type]

    if extra_instruction:
        prompt += f"\n\nCORRECTION INSTRUCTION FROM USER:\n{extra_instruction}\nImprove the previous generation based on this."

    # Use the new types.GenerateContentConfig for the new SDK
    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=pydantic_schema,
        max_output_tokens=4096,
    )

    normalizers = {
        'mcq': _normalize_mcq,
        'fill_in': _normalize_fill_in,
        'true_false': _normalize_true_false,
        'applies': lambda d: d,
    }

    max_attempts = 3
    last_error = None

    for attempt in range(max_attempts):
        try:
            # Using the new SDK client syntax
            response = client.models.generate_content(
                model="gemini-3.1-pro-preview",
                contents=prompt,
                config=config
            )
            raw_text = response.text.strip()

            if raw_text.startswith("```"):
                lines = raw_text.split('\n')
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                raw_text = '\n'.join(lines).strip()

            data = json.loads(raw_text)
            data = normalizers[question_type](data)
            validated = pydantic_schema(**data)
            
            return validated.model_dump(), prompt, raw_text

        except json.JSONDecodeError as e:
            last_error = f"Attempt {attempt + 1}: Invalid JSON from model — {str(e)}"
            logger.warning(last_error)
        except ValidationError as e:
            last_error = f"Attempt {attempt + 1}: Schema validation failed — {e.error_count()} error(s): {e.errors()}"
            logger.warning(last_error)
        except Exception as e:
            last_error = f"Attempt {attempt + 1}: Unexpected error — {type(e).__name__}: {str(e)}"
            logger.warning(last_error)

    raise GenerationValidationError(
        f"Failed to generate valid question after {max_attempts} attempts. Last error: {last_error}"
    )
