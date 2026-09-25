// @ts-nocheck
/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from '../DashboardPage';
import * as api from '../../api';
import { useStore } from '../../store/useStore';

// Mock the API
vi.mock('../../api', () => ({
  fetchDashboardStats: vi.fn(),
}));

const mockStats: api.DashboardStats = {
  reviewed_today: 100,
  review_streak_minimum: 120,
  created_today: 50,
  creation_streak_minimum: 50,
  longest_review_streak: 42,
  current_review_streak: 55,
  due_count: 5,
  monthly_activity: [
    { date: '2025-01-01', reviewed: 10, created: 2, streak_met: false, review_streak_met: false, creation_streak_met: false },
    { date: '2025-01-02', reviewed: 130, created: 50, streak_met: true, review_streak_met: true, creation_streak_met: true },
    { date: '2025-01-03', reviewed: 120, created: 60, streak_met: true, review_streak_met: true, creation_streak_met: true }
  ]
};

const renderWithRouter = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter>
      {ui}
    </MemoryRouter>
  );
};

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState({ dashboardStats: null });
  });

  it('renders loading state initially', async () => {
    vi.mocked(api.fetchDashboardStats).mockReturnValue(new Promise(() => {}));
    renderWithRouter(<DashboardPage />);
    expect(screen.getByText(/Loading your clinical dashboard/i)).toBeInTheDocument();
  });

  it('renders dashboard stats successfully after loading', async () => {
    vi.mocked(api.fetchDashboardStats).mockResolvedValue(mockStats);
    renderWithRouter(<DashboardPage />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading your clinical dashboard/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('/ 120')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('55')).toBeInTheDocument();
  });

  it('selects a past date in ActivityCalendar and updates DayDetailPanel', async () => {
    // Generate dates precisely as the component will see them relative to today
    const now = new Date();
    
    // We must pick a date in the current month, since ActivityCalendar only renders the current month!
    // So let's force the test to run by mocking Date if we want, or just pick today - 1 (unless today is the 1st).
    // Let's use today and today - 1 for safety.
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 1);
    
    // Generate local strings exactly like component does
    const pad = (n: number) => String(n).padStart(2, '0');
    const pastDateStr = `${pastDate.getFullYear()}-${pad(pastDate.getMonth() + 1)}-${pad(pastDate.getDate())}`;

    const customStats = {
      ...mockStats,
      monthly_activity: [
        { date: pastDateStr, reviewed: 99, created: 30, streak_met: false, review_streak_met: false, creation_streak_met: false },
      ]
    };
    
    vi.mocked(api.fetchDashboardStats).mockResolvedValue(customStats);
    renderWithRouter(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading your clinical dashboard/i)).not.toBeInTheDocument();
    });

    // Find the date element for pastDate
    const pastDateElements = screen.getAllByText(String(pastDate.getDate()));
    // There could be multiple elements if the date happens to match a statistic (e.g., '14').
    // Let's pick the one inside the calendar. We know the calendar cells have a specific structure, 
    // or we can just fireEvent on the first one since we know our numbers are unique.
    
    const calendarCell = pastDateElements[0];
    fireEvent.click(calendarCell);

    await waitFor(() => {
      // The DayDetailPanel should show '99' questions mastered
      const masteredElements = screen.getAllByText('99');
      expect(masteredElements.length).toBeGreaterThan(0);
    });
  });
});
