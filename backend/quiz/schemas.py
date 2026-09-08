from typing import List
from pydantic import BaseModel, Field, model_validator


class MCQSchema(BaseModel):
    question: str = Field(..., description="The multiple choice question text")
    options: List[str] = Field(..., description="List of exactly 4 or 5 options")
    correct_index: int = Field(..., description="The zero-based index of the correct option")
    explanation: str = Field(..., description="Explanation of why the correct answer is right")

    @model_validator(mode='after')
    def validate_mcq(self):
        if not (4 <= len(self.options) <= 5):
            raise ValueError(f"Options length must be 4 or 5, got {len(self.options)}")
        if not (0 <= self.correct_index < len(self.options)):
            raise ValueError(
                f"correct_index {self.correct_index} is out of bounds "
                f"for options length {len(self.options)}"
            )
        return self


class TrueFalseStatementSchema(BaseModel):
    true_statement: str = Field(..., description="A factually correct statement derived from the text")
    false_alternative: str = Field(..., description="A plausible but unambiguously false alternative to the true statement")


class TrueFalseSchema(BaseModel):
    stem: str = Field(..., description="The overarching question stem, e.g., 'Concerning diabetes mellitus:'")
    statements: List[TrueFalseStatementSchema] = Field(..., description="List of true/false pairs (at least 1)")

    @model_validator(mode='after')
    def validate_statements(self):
        if len(self.statements) < 1:
            raise ValueError("Must have at least 1 statement pair")
        return self


class FillInOptionSchema(BaseModel):
    text: str = Field(..., description="The text for this option pill")
    correct_for_gaps: List[int] = Field(
        default_factory=list,
        description="List of gap indices (0-based) that this option correctly answers. Empty list means this is a distractor."
    )


class FillInSchema(BaseModel):
    question_text: str = Field(
        ...,
        description="The text with gaps marked as {gap_0}, {gap_1}, etc. (single curly braces, 0-based)"
    )
    answer_bank: List[FillInOptionSchema] = Field(
        ...,
        description="The bank of options — exactly twice as many items as gaps. Half are correct answers, half are distractors."
    )
    gap_count: int = Field(..., description="Total number of gaps in the question (2 to 5)")

    @model_validator(mode='after')
    def validate_gaps(self):
        if not (2 <= self.gap_count <= 5):
            raise ValueError(f"gap_count must be between 2 and 5, got {self.gap_count}")

        # 1. Check every expected placeholder is present in the text
        for i in range(self.gap_count):
            placeholder = "{" + f"gap_{i}" + "}"
            if placeholder not in self.question_text:
                raise ValueError(
                    f"Missing placeholder {placeholder} in question_text. "
                    f"Ensure placeholders use single curly braces, e.g. {{gap_0}}."
                )

        # 2. Check total answer bank length is exactly twice the gap count
        expected_bank_size = self.gap_count * 2
        if len(self.answer_bank) != expected_bank_size:
            raise ValueError(
                f"Answer bank has {len(self.answer_bank)} items but must have exactly "
                f"{expected_bank_size} (twice the gap count of {self.gap_count})."
            )

        # 3. Check every gap index is covered by at least one correct option
        covered_gaps = set()
        for opt in self.answer_bank:
            covered_gaps.update(opt.correct_for_gaps)

        for i in range(self.gap_count):
            if i not in covered_gaps:
                raise ValueError(
                    f"Gap index {i} has no correct answer in the answer bank. "
                    f"At least one option must list {i} in correct_for_gaps."
                )

        return self

class AppliesSchema(BaseModel):
    question: str = Field(..., description="The 'Select all that apply' question stem")
    correct_options: List[str] = Field(
        ..., description="All items from the list that are correct answers (at least 2)"
    )
    wrong_options: List[str] = Field(
        ..., description="Plausible distractors that do NOT belong (at least 2)"
    )

    @model_validator(mode='after')
    def validate_applies(self):
        if len(self.correct_options) < 2:
            raise ValueError("Must have at least 2 correct options")
        if len(self.wrong_options) < 2:
            raise ValueError("Must have at least 2 wrong options")
        return self
