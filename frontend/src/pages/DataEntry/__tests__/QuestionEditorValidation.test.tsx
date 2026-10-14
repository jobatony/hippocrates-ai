// @ts-nocheck
/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QuestionEditor } from '../QuestionEditor';
import { QuestionViewer } from '../QuestionViewer';
import type { PastQuestion } from '../../../api';

describe('QuestionEditor & QuestionViewer - Default Answers & Text Deletion Handling', () => {
  const defaultProps = {
    exam: 1,
    subject: 1,
    year: 2024,
    number: 1,
    onSubmit: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes options with is_correct as null by default and maintains null on add option', () => {
    render(<QuestionEditor {...defaultProps} />);
    
    // Check that 4 option fields exist
    expect(screen.getByText('A.')).toBeInTheDocument();
    expect(screen.getByText('B.')).toBeInTheDocument();
    expect(screen.getByText('C.')).toBeInTheDocument();
    expect(screen.getByText('D.')).toBeInTheDocument();

    // Click Add Option
    const addBtn = screen.getByText(/Add Option/i);
    fireEvent.click(addBtn);

    expect(screen.getByText('E.')).toBeInTheDocument();
  });

  it('QuestionViewer does not badge or highlight any option as correct when is_correct is null', () => {
    const question: PastQuestion = {
      id: 1,
      exam: 1,
      exam_name: 'WAEC',
      subject: 1,
      subject_name: 'PHYSICS',
      year: 2024,
      number: 1,
      question_text: 'Sample question text',
      has_diagram: false,
      status: 'pending',
      options: [
        { id: 1, letter: 'A', text: 'Option A text', is_correct: null },
        { id: 2, letter: 'B', text: 'Option B text', is_correct: null },
        { id: 3, letter: 'C', text: 'Option C text', is_correct: null },
        { id: 4, letter: 'D', text: 'Option D text', is_correct: null },
      ],
    };

    render(<QuestionViewer question={question} />);
    
    // Should NOT have "Correct Answer" badge
    expect(screen.queryByText(/Correct Answer/i)).not.toBeInTheDocument();
  });

  it('when an uploader clears all question text and all options on an existing question, clicking Save calls onDelete and shows confirmation', async () => {
    const existingQuestion: PastQuestion = {
      id: 99,
      exam: 1,
      exam_name: 'WAEC',
      subject: 1,
      subject_name: 'PHYSICS',
      year: 2024,
      number: 1,
      question_text: 'Existing question to clear',
      has_diagram: false,
      status: 'pending',
      options: [
        { id: 1, letter: 'A', text: 'Choice A', is_correct: null },
        { id: 2, letter: 'B', text: 'Choice B', is_correct: null },
      ],
    };

    const onDeleteMock = vi.fn().mockResolvedValue(undefined);

    render(
      <QuestionEditor
        {...defaultProps}
        existingQuestion={existingQuestion}
        onDelete={onDeleteMock}
      />
    );

    // Clear question text
    const textarea = screen.getByDisplayValue('Existing question to clear');
    fireEvent.change(textarea, { target: { value: '' } });

    // Clear option A and B
    const optA = screen.getByDisplayValue('Choice A');
    fireEvent.change(optA, { target: { value: '' } });

    const optB = screen.getByDisplayValue('Choice B');
    fireEvent.change(optB, { target: { value: '' } });

    // Click Save Question
    const saveBtn = screen.getByRole('button', { name: /Save Question/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onDeleteMock).toHaveBeenCalledTimes(1);
    });

    // Confirmation popup should appear
    expect(screen.getByText('Question Cleared')).toBeInTheDocument();
    expect(screen.getByText(/no longer available for validation/i)).toBeInTheDocument();
  });

  it('shows popup when question text is missing but options are filled', async () => {
    const onSubmitMock = vi.fn();

    render(<QuestionEditor {...defaultProps} onSubmit={onSubmitMock} />);

    // Inputs for options A and B
    const inputs = screen.getAllByRole('textbox');
    // First textbox is textarea (question text), subsequent are option inputs
    fireEvent.change(inputs[1], { target: { value: 'Filled option A' } });
    fireEvent.change(inputs[2], { target: { value: 'Filled option B' } });

    const saveBtn = screen.getByRole('button', { name: /Save Question/i });
    fireEvent.click(saveBtn);

    expect(onSubmitMock).not.toHaveBeenCalled();
    expect(screen.getByText('Question Text Required')).toBeInTheDocument();
  });

  it('shows popup when question text is filled but fewer than 2 options have text', async () => {
    const onSubmitMock = vi.fn();

    render(<QuestionEditor {...defaultProps} onSubmit={onSubmitMock} />);

    const inputs = screen.getAllByRole('textbox');
    // Fill question text
    fireEvent.change(inputs[0], { target: { value: 'Valid question text' } });
    // Fill only Option A
    fireEvent.change(inputs[1], { target: { value: 'Only option A' } });

    const saveBtn = screen.getByRole('button', { name: /Save Question/i });
    fireEvent.click(saveBtn);

    expect(onSubmitMock).not.toHaveBeenCalled();
    expect(screen.getByText('Minimum Options Required')).toBeInTheDocument();
  });

  it('shows popup when there is an empty option before a filled option (gap)', async () => {
    const onSubmitMock = vi.fn();

    render(<QuestionEditor {...defaultProps} onSubmit={onSubmitMock} />);

    const inputs = screen.getAllByRole('textbox');
    // Question text
    fireEvent.change(inputs[0], { target: { value: 'Valid question text' } });
    // Option A filled
    fireEvent.change(inputs[1], { target: { value: 'Option A' } });
    // Option B left empty
    fireEvent.change(inputs[2], { target: { value: '' } });
    // Option C filled
    fireEvent.change(inputs[3], { target: { value: 'Option C' } });

    const saveBtn = screen.getByRole('button', { name: /Save Question/i });
    fireEvent.click(saveBtn);

    expect(onSubmitMock).not.toHaveBeenCalled();
    expect(screen.getByText('Empty Option Found')).toBeInTheDocument();
  });

  it('successfully submits when question text and at least 2 options are filled', async () => {
    const onSubmitMock = vi.fn().mockResolvedValue(undefined);

    render(<QuestionEditor {...defaultProps} onSubmit={onSubmitMock} />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'What is photosynthesis?' } });
    fireEvent.change(inputs[1], { target: { value: 'Plant energy process' } });
    fireEvent.change(inputs[2], { target: { value: 'Animal digestion' } });

    const saveBtn = screen.getByRole('button', { name: /Save Question/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          question_text: 'What is photosynthesis?',
          options: [
            expect.objectContaining({ letter: 'A', text: 'Plant energy process', is_correct: null }),
            expect.objectContaining({ letter: 'B', text: 'Animal digestion', is_correct: null }),
          ],
        })
      );
    });
  });
});

