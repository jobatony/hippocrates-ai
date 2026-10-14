// @ts-nocheck
/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ValidatorDashboard } from '../ValidatorDashboard';
import * as api from '../../../api';
import { useStore } from '../../../store/useStore';

vi.mock('../../../api', () => ({
  fetchExams: vi.fn(),
  fetchSubjects: vi.fn(),
  fetchValidatorQuestions: vi.fn(),
  validatePastQuestion: vi.fn(),
  updateValidatorQuestion: vi.fn(),
  fetchAvailableYears: vi.fn(),
  fetchQuestionList: vi.fn(),
  logoutUser: vi.fn(),
}));

describe('ValidatorPortalActions - Button Placement & Behavior', () => {
  const mockExams: api.Exam[] = [{ id: 1, name: 'WAEC' }];
  const mockSubjects: api.Subject[] = [{ id: 1, name: 'PHYSICS' }];
  const mockQuestions: api.PastQuestion[] = [
    {
      id: 10,
      exam: 1,
      exam_name: 'WAEC',
      subject: 1,
      subject_name: 'PHYSICS',
      year: 2024,
      number: 1,
      question_text: 'What is electromagnetic radiation?',
      has_diagram: false,
      status: 'pending',
      options: [
        { id: 1, letter: 'A', text: 'Wave energy', is_correct: null },
        { id: 2, letter: 'B', text: 'Solid particle', is_correct: null },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState({
      currentUser: {
        id: 2,
        first_name: 'Jane',
        last_name: 'Validator',
        email: 'val@test.com',
        is_staff: false,
        groups: ['Validator'],
      },
    });

    vi.mocked(api.fetchExams).mockResolvedValue(mockExams);
    vi.mocked(api.fetchSubjects).mockResolvedValue(mockSubjects);
    vi.mocked(api.fetchValidatorQuestions).mockResolvedValue(mockQuestions);
  });

  it('renders Request Changes on the left and Approve Question on the right in a 2-column grid', async () => {
    render(
      <MemoryRouter initialEntries={['/data-entry/validate']}>
        <ValidatorDashboard />
      </MemoryRouter>
    );

    // Click on the pending question in the queue
    const questionItem = await screen.findByText(/2024 - Question 1/i);
    fireEvent.click(questionItem);

    // Wait for the validation actions section to appear
    const requestBtn = await screen.findByRole('button', { name: /Request Changes/i });
    const approveBtn = await screen.findByRole('button', { name: /Approve Question/i });

    expect(requestBtn).toBeInTheDocument();
    expect(approveBtn).toBeInTheDocument();

    // Verify parent container is a grid with 2 columns
    const buttonContainer = requestBtn.parentElement;
    expect(buttonContainer).toHaveClass('grid');
    expect(buttonContainer).toHaveClass('grid-cols-2');

    // Verify position order: Request Changes is first (left), Approve Question is second (right)
    expect(buttonContainer.children[0]).toBe(requestBtn);
    expect(buttonContainer.children[1]).toBe(approveBtn);

    // Verify visual classes
    expect(requestBtn).toHaveClass('bg-error');
    expect(approveBtn).toHaveClass('bg-secondary');
  });

  it('disables Request Changes when feedback is empty and enables it when feedback is provided', async () => {
    render(
      <MemoryRouter initialEntries={['/data-entry/validate']}>
        <ValidatorDashboard />
      </MemoryRouter>
    );

    const questionItem = await screen.findByText(/2024 - Question 1/i);
    fireEvent.click(questionItem);

    const requestBtn = await screen.findByRole('button', { name: /Request Changes/i });
    expect(requestBtn).toBeDisabled();

    // Type feedback in textarea
    const textarea = screen.getByPlaceholderText(/Feedback \(required if requesting changes\)/i);
    fireEvent.change(textarea, { target: { value: 'Please fix typo in option B' } });

    expect(requestBtn).not.toBeDisabled();
  });

  it('clicking Approve Question calls validatePastQuestion with approve action', async () => {
    vi.mocked(api.validatePastQuestion).mockResolvedValue({ status: 'approved' });

    render(
      <MemoryRouter initialEntries={['/data-entry/validate']}>
        <ValidatorDashboard />
      </MemoryRouter>
    );

    const questionItem = await screen.findByText(/2024 - Question 1/i);
    fireEvent.click(questionItem);

    const approveBtn = await screen.findByRole('button', { name: /Approve Question/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(api.validatePastQuestion).toHaveBeenCalledWith(10, 'approve', '');
    });
  });
});

