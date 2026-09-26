import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg';
  hideCloseButton?: boolean;
  heightClass?: string;
  centerOnMobile?: boolean;
}

export const AppModal: React.FC<AppModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'sm',
  hideCloseButton = false,
  heightClass = '',
  centerOnMobile = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    xs: 'sm:max-w-xs',
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
  };

  return (
    <div className={`fixed inset-0 bg-black/40 backdrop-filter backdrop-blur-md z-[100] flex justify-center p-md sm:p-md ${centerOnMobile ? 'items-center' : 'items-end sm:items-center'}`}>
      <div className="absolute inset-0 z-0" onClick={onClose} />
      <div className={`relative z-10 bg-surface-container-highest w-full shadow-2xl flex flex-col p-xl ${maxWidthClasses[maxWidth]} ${heightClass} ${centerOnMobile ? 'rounded-2xl max-h-[90dvh]' : 'rounded-t-2xl sm:rounded-2xl max-h-[90dvh] sm:max-h-[90dvh]'}`}>
        {(title || !hideCloseButton) && (
          <div className="flex justify-between items-center mb-lg shrink-0">
            {title ? <h2 className="font-headline-md text-on-surface">{title}</h2> : <div />}
            {!hideCloseButton && (
              <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-1 rounded hover:bg-surface-container-high transition-colors">
                <X size={20} />
              </button>
            )}
          </div>
        )}
        <div className="overflow-y-auto custom-scrollbar max-h-[70dvh] flex-1 min-h-0 -mr-sm pr-sm">
          {children}
        </div>
      </div>
    </div>
  );
};
