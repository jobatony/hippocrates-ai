import React from 'react';
import { useStore } from '../store/useStore';
import { CheckCircle2 } from 'lucide-react';

interface Props {
  results: { questionId: string; correct: boolean }[];
  total: number;
}

export const ResultsSummary: React.FC<Props> = ({ results, total }) => {
  const { setMode } = useStore();
  const correctCount = results.filter(r => r.correct).length;
  const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  return (
    <div className="select-text flex-1 flex flex-col py-xl md:py-[10vh] px-md md:px-xl gap-lg md:overflow-y-auto bg-surface w-full items-center">
      
      {/* 100% Progress Bar */}
      <div className="w-full max-w-3xl">
        <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden mb-1">
          <div 
            className="bg-primary h-1.5 rounded-full transition-all duration-300 ease-out" 
            style={{ width: '100%' }}
          />
        </div>
        <div className="flex justify-between items-center mb-md">
          <div className="text-label-sm text-on-surface-variant font-bold tracking-widest uppercase flex items-center gap-xs">
            <span>Question {total} / {total}</span>
            <span className="opacity-50">·</span>
            <span>100% Complete</span>
          </div>
        </div>
      </div>

      {/* Results Card */}
      <div className="w-full max-w-xl bg-surface-container-lowest border border-outline-variant rounded-[2rem] p-xl flex flex-col items-center justify-center gap-md mt-md shadow-sm">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
          <CheckCircle2 size={40} />
        </div>
        
        <h1 className="font-display-sm text-on-surface">Review Complete!</h1>
        
        <div className="flex flex-col items-center mt-md">
          <div className="flex items-baseline gap-sm">
            <span className="text-[3.5rem] font-black leading-none text-primary tracking-tighter">{correctCount}</span>
            <span className="text-[3.5rem] font-black leading-none text-on-surface-variant opacity-50 tracking-tighter">/ {total}</span>
          </div>
          <p className="text-label-md text-on-surface-variant uppercase tracking-widest mt-4 font-bold">
            Questions Correct
          </p>
          
          <div className="mt-4 px-md py-1 rounded-full bg-surface-container-high text-on-surface font-label-md">
            Score: {percentage}%
          </div>
        </div>
        
        <div className="flex w-full gap-md mt-xl pt-xl border-t border-outline-variant">
          <button 
            onClick={() => setMode('read')} 
            className="flex-1 px-xl py-md bg-primary hover:bg-primary/90 text-on-primary rounded-xl transition-colors font-label-lg shadow-sm"
          >
            Return to Reading
          </button>
        </div>
      </div>
    </div>
  );
};
