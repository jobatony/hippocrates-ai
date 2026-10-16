// @ts-nocheck
/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboard } from '../AdminDashboard';
import { QuestionViewer } from '../QuestionViewer';
import * as api from '../../../api';
import { useStore } from '../../../store/useStore';

vi.mock('../../../api', () => ({
  fetchExams: vi.fn(),
  createExam: vi.fn(),
  deleteExam: vi.fn(),
  fetchSubjects: vi.fn(),
  createSubject: vi.fn(),
  deleteSubject: vi.fn(),
  fetchAdminUsers: vi.fn(),
  updateUserRoles: vi.fn(),
  fetchAdminQuestions: vi.fn(),
  deleteAdminQuestion: vi.fn(),
  bulkDeleteAdminQuestions: vi.fn(),
  fetchAnalyticsSummary: vi.fn(),
  fetchUserAnalyticsDetail: vi.fn(),
  logoutUser: vi.fn(),
}));

describe('Admin Question Deletion & Analytics Tracking', () => {
  const mockExams: api.Exam[] = [{ id: 1, name: 'WAEC' }];
  const mockSubjects: api.Subject[] = [{ id: 1, name: 'PHYSICS' }];
  const mockUsers: api.AuthUser[] = [
    {
      id: 'u-1',
      first_name: 'Alice',
      last_name: 'Uploader',
      email: 'alice@test.com',
      is_staff: false,
      groups: ['Uploader'],
    },
  ];
  const mockQuestions: api.PastQuestion[] = [
    {
      id: 101,
      exam: 1,
      exam_name: 'WAEC',
      subject: 1,
      subject_name: 'PHYSICS',
      year: 2024,
      number: 1,
      question_text: 'What is Newton first law?',
      has_diagram: false,
      image: null,
      status: 'approved',
      validator_feedback: null,
      uploaded_by: 'u-1',
      uploaded_by_name: 'Alice Uploader',
      uploaded_by_email: 'alice@test.com',
      options: [
        { id: 1, letter: 'A', text: 'Law of inertia', is_correct: null },
        { id: 2, letter: 'B', text: 'F = ma', is_correct: null },
      ],
      created_at: '2026-10-16T00:00:00Z',
      updated_at: '2026-10-16T00:00:00Z',
    },
    {
      id: 102,
      exam: 1,
      exam_name: 'WAEC',
      subject: 1,
      subject_name: 'PHYSICS',
      year: 2024,
      number: 2,
      question_text: 'What is Ohm law?',
      has_diagram: false,
      image: null,
      status: 'pending',
      validator_feedback: null,
      uploaded_by: 'u-1',
      uploaded_by_name: 'Alice Uploader',
      uploaded_by_email: 'alice@test.com',
      options: [
        { id: 3, letter: 'A', text: 'V = IR', is_correct: null },
        { id: 4, letter: 'B', text: 'P = IV', is_correct: null },
      ],
      created_at: '2026-10-16T00:00:00Z',
      updated_at: '2026-10-16T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    useStore.setState({
      currentUser: {
        id: 'admin-1',
        first_name: 'Super',
        last_name: 'Admin',
        email: 'admin@test.com',
        is_staff: true,
        is_superuser: true,
        groups: [],
      },
    });

    vi.mocked(api.fetchExams).mockResolvedValue(mockExams);
    vi.mocked(api.fetchSubjects).mockResolvedValue(mockSubjects);
    vi.mocked(api.fetchAdminUsers).mockResolvedValue(mockUsers);
    vi.mocked(api.fetchAdminQuestions).mockResolvedValue(mockQuestions);
    vi.mocked(api.deleteAdminQuestion).mockResolvedValue();
    vi.mocked(api.bulkDeleteAdminQuestions).mockResolvedValue({ deleted_count: 2 });
    vi.mocked(api.fetchAnalyticsSummary).mockResolvedValue([
      {
        id: 'admin-1',
        email: 'admin@test.com',
        first_name: 'Super',
        last_name: 'Admin',
        roles: ['Admin'],
        total_uploaded: 0,
        total_approved: 0,
        total_changes_requested: 0,
        total_edited: 0,
        total_deleted: 3,
      },
    ]);
    vi.mocked(api.fetchUserAnalyticsDetail).mockResolvedValue([
      {
        id: 500,
        action: 'deleted',
        timestamp: '2026-10-16T10:00:00Z',
        notes: null,
        question_info: 'WAEC 2024 PHYSICS - Q1',
      },
    ]);
  });

  it('allows Admin to browse questions, filter by status, single delete, and bulk delete', async () => {
    render(
      <MemoryRouter initialEntries={['/data-entry/admin']}>
        <AdminDashboard />
      </MemoryRouter>
    );

    const questionsTab = screen.getByRole('button', { name: /Questions/i });
    fireEvent.click(questionsTab);

    expect(await screen.findByText(/WAEC 2024 PHYSICS - Q1/i)).toBeInTheDocument();
    expect(screen.getByText(/WAEC 2024 PHYSICS - Q2/i)).toBeInTheDocument();

    // Filter by Status = approved
    const statusSelect = screen.getByLabelText(/Filter by Status/i);
    fireEvent.change(statusSelect, { target: { value: 'approved' } });

    await waitFor(() => {
      expect(api.fetchAdminQuestions).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'approved' })
      );
    });

    // Single delete Q1 - opens ConfirmModal
    const deleteQ1Btn = screen.getByLabelText(/Delete WAEC 2024 PHYSICS Q1/i);
    fireEvent.click(deleteQ1Btn);

    expect(await screen.findByText('Delete Question?')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete WAEC 2024 PHYSICS - Question 1\?/i)).toBeInTheDocument();
    
    // Click Delete in ConfirmModal
    const confirmSingleDeleteBtn = screen.getByRole('button', { name: /^Delete$/i });
    fireEvent.click(confirmSingleDeleteBtn);

    await waitFor(() => {
      expect(api.deleteAdminQuestion).toHaveBeenCalledWith(101);
    });

    // Bulk select all & bulk delete - opens ConfirmModal
    const selectAllCheckbox = screen.getByLabelText(/Select All/i);
    fireEvent.click(selectAllCheckbox);

    const bulkDeleteBtn = await screen.findByRole('button', { name: /Delete Selected \(2\)/i });
    fireEvent.click(bulkDeleteBtn);

    expect(await screen.findByText('Delete Questions?')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete 2 selected question\(s\)\?/i)).toBeInTheDocument();

    // Click Delete (2) in ConfirmModal
    const confirmBulkDeleteBtn = screen.getByRole('button', { name: /^Delete \(2\)$/i });
    fireEvent.click(confirmBulkDeleteBtn);

    await waitFor(() => {
      expect(api.bulkDeleteAdminQuestions).toHaveBeenCalledWith([101, 102]);
    });
  });

  it('displays Deleted column in Analytics summary and DELETED badge in Activity Log modal', async () => {
    render(
      <MemoryRouter initialEntries={['/data-entry/admin']}>
        <AdminDashboard />
      </MemoryRouter>
    );

    const analyticsTab = screen.getByRole('button', { name: /Analytics/i });
    fireEvent.click(analyticsTab);

    expect(await screen.findByText('Deleted')).toBeInTheDocument();
    expect(await screen.findByText('3')).toBeInTheDocument();

    // Click user row to open activity log modal
    const userRow = screen.getByText('admin@test.com');
    fireEvent.click(userRow);

    expect(await screen.findByText('deleted')).toBeInTheDocument();
    expect(screen.getByText('WAEC 2024 PHYSICS - Q1')).toBeInTheDocument();
  });

  it('renders Delete Question button in QuestionViewer only when onDelete is provided', () => {
    const { rerender } = render(<QuestionViewer question={mockQuestions[0]} />);
    expect(screen.queryByRole('button', { name: /Delete Question/i })).not.toBeInTheDocument();

    const onDeleteMock = vi.fn();
    rerender(<QuestionViewer question={mockQuestions[0]} onDelete={onDeleteMock} />);
    const deleteBtn = screen.getByRole('button', { name: /Delete Question/i });
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(deleteBtn);
    expect(onDeleteMock).toHaveBeenCalledTimes(1);
  });

  it('locks background body scroll when Question Preview modal is open and restores it when closed', async () => {
    render(
      <MemoryRouter initialEntries={['/data-entry/admin']}>
        <AdminDashboard />
      </MemoryRouter>
    );

    const questionsTab = screen.getByRole('button', { name: /Questions/i });
    fireEvent.click(questionsTab);

    expect(await screen.findByText(/WAEC 2024 PHYSICS - Q1/i)).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');

    // Open Question Preview
    const previewButtons = screen.getAllByRole('button', { name: /Preview/i });
    fireEvent.click(previewButtons[0]);

    // Modal is open -> body scroll should be locked
    expect(await screen.findByText('Question Preview')).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');

    // Close Question Preview modal
    const closeBtn = screen.getByLabelText(/Close Preview/i);
    fireEvent.click(closeBtn);

    // Modal is closed -> body scroll should be restored
    await waitFor(() => {
      expect(document.body.style.overflow).toBe('');
    });
  });
});

