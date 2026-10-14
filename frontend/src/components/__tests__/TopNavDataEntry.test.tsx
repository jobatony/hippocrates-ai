// @ts-nocheck
/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { TopNav } from '../TopNav';
import { useStore } from '../../store/useStore';

vi.mock('../../api', () => ({
  logoutUser: vi.fn(),
  fetchMaterials: vi.fn().mockResolvedValue([]),
  fetchAvailableYears: vi.fn().mockResolvedValue([]),
  fetchQuestionList: vi.fn().mockResolvedValue([]),
}));

describe('TopNav - Profile Dropdown Data Entry Navigation by Role', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Data Entry Portal" shortcut for staff user outside data-entry route', () => {
    useStore.setState({
      currentUser: {
        id: 1,
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@test.com',
        is_staff: true,
        groups: [],
      },
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <TopNav />
      </MemoryRouter>
    );

    const avatarBtn = screen.getByText('A').closest('button');
    fireEvent.click(avatarBtn);

    expect(screen.getByText('Data Entry Portal')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Data Entry Portal/i })).toHaveAttribute('href', '/data-entry');
  });

  it('renders Admin link (and NOT Upload or Validate) for staff user inside /data-entry route', () => {
    useStore.setState({
      currentUser: {
        id: 1,
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@test.com',
        is_staff: true,
        groups: [],
      },
    });

    render(
      <MemoryRouter initialEntries={['/data-entry/admin']}>
        <TopNav />
      </MemoryRouter>
    );

    const avatarBtn = screen.getByText('A').closest('button');
    fireEvent.click(avatarBtn);

    const portalsHeader = screen.getByText('Data Entry Portals');
    const dropdownMenu = portalsHeader.parentElement;

    expect(within(dropdownMenu).getByRole('link', { name: /Admin/i })).toHaveAttribute('href', '/data-entry/admin');
    expect(within(dropdownMenu).queryByRole('link', { name: /^Upload$/i })).not.toBeInTheDocument();
    expect(within(dropdownMenu).queryByRole('link', { name: /^Validate$/i })).not.toBeInTheDocument();
  });

  it('renders Upload link (and NOT Admin or Validate) for an uploader inside /data-entry route', () => {
    useStore.setState({
      currentUser: {
        id: 2,
        first_name: 'Upload',
        last_name: 'Person',
        email: 'up@test.com',
        is_staff: false,
        groups: ['Uploader'],
      },
    });

    render(
      <MemoryRouter initialEntries={['/data-entry/upload']}>
        <TopNav />
      </MemoryRouter>
    );

    const avatarBtn = screen.getByText('U').closest('button');
    fireEvent.click(avatarBtn);

    const portalsHeader = screen.getByText('Data Entry Portals');
    const dropdownMenu = portalsHeader.parentElement;

    expect(within(dropdownMenu).getByRole('link', { name: /Upload/i })).toHaveAttribute('href', '/data-entry/upload');
    expect(within(dropdownMenu).queryByRole('link', { name: /^Admin$/i })).not.toBeInTheDocument();
    expect(within(dropdownMenu).queryByRole('link', { name: /^Validate$/i })).not.toBeInTheDocument();
  });

  it('renders Validate link (and NOT Admin or Upload) for a validator inside /data-entry route', () => {
    useStore.setState({
      currentUser: {
        id: 3,
        first_name: 'Val',
        last_name: 'Person',
        email: 'val@test.com',
        is_staff: false,
        groups: ['Validator'],
      },
    });

    render(
      <MemoryRouter initialEntries={['/data-entry/validate']}>
        <TopNav />
      </MemoryRouter>
    );

    const avatarBtn = screen.getByText('V').closest('button');
    fireEvent.click(avatarBtn);

    const portalsHeader = screen.getByText('Data Entry Portals');
    const dropdownMenu = portalsHeader.parentElement;

    expect(within(dropdownMenu).getByRole('link', { name: /Validate/i })).toHaveAttribute('href', '/data-entry/validate');
    expect(within(dropdownMenu).queryByRole('link', { name: /^Admin$/i })).not.toBeInTheDocument();
    expect(within(dropdownMenu).queryByRole('link', { name: /^Upload$/i })).not.toBeInTheDocument();
  });

  it('renders both Upload and Validate links for a user having both roles', () => {
    useStore.setState({
      currentUser: {
        id: 4,
        first_name: 'Multi',
        last_name: 'Role',
        email: 'multi@test.com',
        is_staff: false,
        groups: ['Uploader', 'Validator'],
      },
    });

    render(
      <MemoryRouter initialEntries={['/data-entry/upload']}>
        <TopNav />
      </MemoryRouter>
    );

    const avatarBtn = screen.getByText('M').closest('button');
    fireEvent.click(avatarBtn);

    const portalsHeader = screen.getByText('Data Entry Portals');
    const dropdownMenu = portalsHeader.parentElement;

    expect(within(dropdownMenu).getByRole('link', { name: /Upload/i })).toHaveAttribute('href', '/data-entry/upload');
    expect(within(dropdownMenu).getByRole('link', { name: /Validate/i })).toHaveAttribute('href', '/data-entry/validate');
    expect(within(dropdownMenu).queryByRole('link', { name: /^Admin$/i })).not.toBeInTheDocument();
  });

  it('does NOT render Data Entry Portal shortcut for standard student without roles', () => {
    useStore.setState({
      currentUser: {
        id: 5,
        first_name: 'Regular',
        last_name: 'Student',
        email: 'student@test.com',
        is_staff: false,
        groups: [],
      },
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <TopNav />
      </MemoryRouter>
    );

    const avatarBtn = screen.getByText('R').closest('button');
    fireEvent.click(avatarBtn);

    expect(screen.queryByText('Data Entry Portal')).not.toBeInTheDocument();
  });
});
