// @ts-nocheck
/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboard } from '../AdminDashboard';
import { ValidatorDashboard } from '../ValidatorDashboard';
import * as api from '../../../api';
import { useStore } from '../../../store/useStore';

vi.mock('../../../api', () => ({
  fetchExams: vi.fn(),
  fetchSubjects: vi.fn(),
  fetchAdminUsers: vi.fn(),
  updateUserRoles: vi.fn(),
  fetchValidatorQuestions: vi.fn(),
  fetchAvailableYears: vi.fn(),
  fetchQuestionList: vi.fn(),
  logoutUser: vi.fn(),
}));

describe('DataEntry Responsiveness & Overflow Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState({
      currentUser: {
        id: 1,
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@test.com',
        is_staff: true,
        groups: ['Validator'],
      },
    });

    vi.mocked(api.fetchExams).mockResolvedValue([{ id: 1, name: 'WAEC' }]);
    vi.mocked(api.fetchSubjects).mockResolvedValue([{ id: 1, name: 'PHYSICS' }]);
    vi.mocked(api.fetchAdminUsers).mockResolvedValue([
      { id: 10, first_name: 'Test', last_name: 'User', email: 'tester@test.com', groups: ['Uploader'] },
    ]);
    vi.mocked(api.fetchValidatorQuestions).mockResolvedValue([]);
  });

  it('AdminDashboard containers and action buttons use responsive, shrink-safe flex layouts', async () => {
    render(
      <MemoryRouter initialEntries={['/data-entry/admin']}>
        <AdminDashboard />
      </MemoryRouter>
    );

    // Add Exam button in Exams tab
    const addExamBtn = await screen.findByRole('button', { name: /Add Exam/i });
    expect(addExamBtn).toHaveClass('shrink-0');
    expect(addExamBtn.parentElement).toHaveClass('flex-col');
    expect(addExamBtn.parentElement).toHaveClass('sm:flex-row');

    // Switch to Subjects tab
    const subjectsTabBtn = screen.getByRole('button', { name: /^Subjects$/i });
    subjectsTabBtn.click();

    // Add Subject button in Subjects tab
    const addSubjectBtn = await screen.findByRole('button', { name: /Add Subject/i });
    expect(addSubjectBtn).toHaveClass('shrink-0');
    expect(addSubjectBtn.parentElement).toHaveClass('flex-col');
    expect(addSubjectBtn.parentElement).toHaveClass('sm:flex-row');

    // Switch to Users tab
    const usersTabBtn = screen.getByRole('button', { name: /^Users$/i });
    usersTabBtn.click();

    // User row and role checkboxes are enclosed in responsive shrink-safe containers
    const uploaderCheckbox = await screen.findByRole('checkbox', { name: /Uploader/i });
    const validatorCheckbox = await screen.findByRole('checkbox', { name: /Validator/i });

    expect(uploaderCheckbox).toBeInTheDocument();
    expect(validatorCheckbox).toBeInTheDocument();

    // Container has flex-wrap and shrink-0 to prevent overflowing smaller screens
    const checkboxContainer = uploaderCheckbox.closest('div');
    expect(checkboxContainer).toHaveClass('flex-wrap');
    expect(checkboxContainer).toHaveClass('shrink-0');
  });

  it('ValidatorDashboard action buttons use a 2-column grid and touch-friendly min height', async () => {
    vi.mocked(api.fetchValidatorQuestions).mockResolvedValue([
      {
        id: 5,
        exam: 1,
        exam_name: 'WAEC',
        subject: 1,
        subject_name: 'PHYSICS',
        year: 2024,
        number: 1,
        question_text: 'Test question',
        has_diagram: false,
        status: 'pending',
        options: [
          { id: 1, letter: 'A', text: 'Opt A', is_correct: null },
          { id: 2, letter: 'B', text: 'Opt B', is_correct: null },
        ],
      },
    ]);

    render(
      <MemoryRouter initialEntries={['/data-entry/validate']}>
        <ValidatorDashboard />
      </MemoryRouter>
    );

    // Select the question from queue
    const questionItem = await screen.findByText(/2024 - Question 1/i);
    questionItem.click();

    const requestBtn = await screen.findByRole('button', { name: /Request Changes/i });
    const approveBtn = await screen.findByRole('button', { name: /Approve Question/i });

    // Verify grid layout preventing horizontal overflow on compact screens
    const gridContainer = requestBtn.parentElement;
    expect(gridContainer).toHaveClass('grid');
    expect(gridContainer).toHaveClass('grid-cols-2');

    // Both buttons should have min-h-[48px] for accessible mobile tapping
    expect(requestBtn).toHaveClass('min-h-[48px]');
    expect(approveBtn).toHaveClass('min-h-[48px]');
  });
});
