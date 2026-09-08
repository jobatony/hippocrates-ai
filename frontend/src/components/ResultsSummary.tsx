import React from 'react';
import { useStore } from '../store/useStore';

interface Props {
  results: { questionId: string; correct: boolean }[];
  total: number;
}

export const ResultsSummary: React.FC<Props> = ({ results, total }) => {
  const { setMode } = useStore();
  const correct = results.filter(r => r.correct).length;

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-lg">
      <h1 className="font-headline-lg text-on-surface">Session Complete!</h1>
      <p className="font-display-sm text-primary">{correct} / {total}</p>
      <p className="text-body-md text-on-surface-variant">questions answered correctly</p>
      
      <div className="flex gap-md mt-lg">
        <button 
          onClick={() => setMode('read')} 
          className="px-xl py-sm bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-full transition-colors font-label-lg"
        >
          Back to Read Mode
        </button>
      </div>
    </div>
  );
};
