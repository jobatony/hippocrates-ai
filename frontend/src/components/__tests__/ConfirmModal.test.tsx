// @ts-nocheck
/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ConfirmModal } from '../ConfirmModal';
import { lockBodyScroll, unlockBodyScroll } from '../../hooks/useBodyScrollLock';

describe('ConfirmModal Component', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
  });

  it('renders title, message, and action buttons', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete Question?"
        message="Are you sure you want to delete this question?"
        confirmText="Yes, Delete"
        cancelText="No, Keep"
      />
    );

    expect(screen.getByText('Delete Question?')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this question?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yes, Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No, Keep' })).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete Question?"
        message="Are you sure you want to delete this question?"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete Question?"
        message="Are you sure you want to delete this question?"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('disables buttons and shows spinner when isLoading is true', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        isLoading={true}
        title="Deleting..."
        message="Please wait"
      />
    );

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    expect(cancelBtn).toBeDisabled();

    // Confirm button shows spinner
    const buttons = screen.getAllByRole('button');
    expect(buttons[1]).toBeDisabled();
  });

  it('closes on Escape key press when not loading', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Confirm"
        message="Press Escape"
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('locks body scroll when open and restores it when unmounted', () => {
    expect(document.body.style.overflow).toBe('');

    const { unmount } = render(
      <ConfirmModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Confirm"
        message="Check scroll lock"
      />
    );

    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('');
  });

  it('correctly handles nested/stacked scroll locks', () => {
    expect(document.body.style.overflow).toBe('');

    lockBodyScroll();
    expect(document.body.style.overflow).toBe('hidden');

    lockBodyScroll();
    expect(document.body.style.overflow).toBe('hidden');

    unlockBodyScroll();
    // Still 1 lock remaining
    expect(document.body.style.overflow).toBe('hidden');

    unlockBodyScroll();
    // All locks released
    expect(document.body.style.overflow).toBe('');
  });
});

