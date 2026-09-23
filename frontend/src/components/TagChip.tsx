import React from 'react';
import { X } from 'lucide-react';

interface Props {
  label: string;
  onRemove?: () => void;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}

export const TagChip: React.FC<Props> = ({ label, onRemove, onClick, active, className = '' }) => (
  <div
    onClick={onClick}
    className={`group inline-flex items-center gap-xs px-sm py-[2px] rounded-full text-label-sm border shadow-sm
      cursor-pointer select-none transition-colors max-w-[180px] ${className}
      ${active
        ? 'bg-primary text-on-primary border-primary'
        : 'bg-secondary-container text-on-secondary-container border-outline-variant hover:border-primary hover:text-primary'
      }`}
  >
    <span className="truncate flex-1 min-w-0">{label}</span>
    {onRemove && (
      <button
        onClick={e => { e.stopPropagation(); onRemove(); }}
        className="ml-[2px] flex-shrink-0 opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity focus:opacity-70"
      >
        <X size={10} />
      </button>
    )}
  </div>
);
