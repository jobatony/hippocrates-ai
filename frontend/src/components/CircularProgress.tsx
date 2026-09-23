import React from 'react';

interface Props {
  percent: number;      // 0–100
  size?: number;        // default 96
  strokeWidth?: number; // default 3.5
  label?: string;       // centre label e.g. "70%"
}

export const CircularProgress: React.FC<Props> = ({ percent, size = 96, strokeWidth = 3.5, label }) => {
  return (
    <div 
      className="relative flex-shrink-0 flex items-center justify-center" 
      style={{ width: size, height: size }}
    >
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
        <path 
          className="text-surface-variant" 
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth={strokeWidth} 
        />
        <path 
          className="text-secondary" 
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
          fill="none" 
          stroke="currentColor" 
          strokeDasharray={`${percent}, 100`} 
          strokeLinecap="round" 
          strokeWidth={strokeWidth} 
        />
      </svg>
      {label && (
        <span className="absolute font-label-md text-label-md text-secondary">
          {label}
        </span>
      )}
    </div>
  );
};
