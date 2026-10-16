import React from 'react';
import { AppModal } from './AppModal';
import { Trash2, AlertTriangle, Info, Loader2 } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  icon?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText,
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  icon,
  maxWidth = 'sm',
}) => {
  const defaultConfirmText = variant === 'danger' ? 'Delete' : 'Confirm';
  const effectiveConfirmText = confirmText || defaultConfirmText;

  const renderIcon = () => {
    if (icon !== undefined) return icon;
    if (variant === 'danger') {
      return (
        <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center mb-md shrink-0">
          <Trash2 size={24} />
        </div>
      );
    }
    if (variant === 'warning') {
      return (
        <div className="w-12 h-12 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center mb-md shrink-0">
          <AlertTriangle size={24} />
        </div>
      );
    }
    return (
      <div className="w-12 h-12 rounded-full bg-primary-container text-primary flex items-center justify-center mb-md shrink-0">
        <Info size={24} />
      </div>
    );
  };

  const getConfirmButtonClasses = () => {
    if (variant === 'danger') {
      return 'bg-error text-on-error hover:bg-error/90 shadow-sm';
    }
    if (variant === 'warning') {
      return 'bg-amber-600 text-white hover:bg-amber-700 shadow-sm';
    }
    return 'bg-primary text-on-primary hover:bg-primary/90 shadow-sm';
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      title={title}
      hideCloseButton
      maxWidth={maxWidth}
      centerOnMobile
    >
      <div className="flex flex-col items-center text-center mt-md">
        {renderIcon()}
        <div className="text-body-md text-on-surface-variant w-full whitespace-normal break-words">
          {message}
        </div>
      </div>
      <div className="flex justify-end gap-sm mt-xl">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="px-lg py-sm rounded-full text-label-md font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`px-lg py-sm rounded-full text-label-md font-bold transition-colors disabled:opacity-50 flex items-center justify-center min-w-[100px] gap-xs ${getConfirmButtonClasses()}`}
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : effectiveConfirmText}
        </button>
      </div>
    </AppModal>
  );
};

