import React from 'react';
import type { FillInPayload } from '../store/useStore';
import clsx from 'clsx';
import { Plus, Minus } from 'lucide-react';

interface Props {
  payload: FillInPayload;
  isEditing: boolean;
  onChange: (newPayload: FillInPayload) => void;
}

export const FillInRenderer: React.FC<Props> = ({ payload, isEditing, onChange }) => {
  if (isEditing) {
    return (
      <div className="space-y-sm">
        <textarea
          value={payload.question_text}
          onChange={e => onChange({ ...payload, question_text: e.target.value })}
          className="w-full p-sm bg-surface rounded border border-outline text-body-md text-on-surface focus:outline-none focus:border-primary resize-none font-mono text-sm"
          rows={4}
          placeholder="Use {{gap_0}}, {{gap_1}} for gaps..."
        />
        
        <div className="text-label-sm text-on-surface-variant mt-sm">Answer Bank</div>
        <div className="space-y-xs">
          {payload.answer_bank.map((opt, i) => (
            <div key={i} className="flex items-center gap-sm">
              <input
                type="text"
                value={opt.text}
                onChange={e => {
                  const newBank = [...payload.answer_bank];
                  newBank[i].text = e.target.value;
                  onChange({ ...payload, answer_bank: newBank });
                }}
                className="flex-1 p-xs bg-surface rounded border border-outline focus:outline-none focus:border-primary text-body-sm"
              />
              <input
                type="text"
                value={opt.correct_for_gaps.join(', ')}
                onChange={e => {
                  const newBank = [...payload.answer_bank];
                  const vals = e.target.value.split(',').map(v => parseInt(v.trim())).filter(n => !isNaN(n));
                  newBank[i].correct_for_gaps = vals;
                  onChange({ ...payload, answer_bank: newBank });
                }}
                className="w-24 p-xs bg-surface rounded border border-outline focus:outline-none focus:border-primary text-body-sm"
                placeholder="Gaps (e.g. 0, 1)"
              />
              <button
                onClick={() => {
                  const newBank = payload.answer_bank.filter((_, idx) => idx !== i);
                  onChange({ ...payload, answer_bank: newBank });
                }}
                className="text-error hover:bg-error-container p-1 rounded"
              >
                <Minus size={14} />
              </button>
            </div>
          ))}
        </div>
        
        <button
          onClick={() => onChange({
            ...payload, 
            answer_bank: [...payload.answer_bank, { text: '', correct_for_gaps: [] }]
          })}
          className="w-full py-xs mt-xs flex items-center justify-center gap-xs text-primary text-label-sm hover:bg-primary-container/20 rounded transition-colors"
        >
          <Plus size={14} /> Add Option
        </button>
      </div>
    );
  }

  // Read-only view
  const parts = payload.question_text?.split(/(\{{1,2}gap_\d+\}{1,2})/g) || [];

  return (
    <div>
      <div className="font-body-md text-on-surface mb-lg leading-loose bg-surface p-md rounded-lg shadow-inner">
        {parts.map((part: string, index: number) => {
          if (part.match(/^\{{1,2}gap_\d+\}{1,2}$/)) {
            const gapId = part.match(/\d+/)?.[0];
            return (
              <span key={index} className="inline-block px-2 min-w-[3rem] h-6 bg-surface-container-highest border-b-2 border-outline-variant mx-sm align-middle rounded-t text-center text-label-sm text-on-surface-variant font-mono">
                {gapId}
              </span>
            );
          }
          return <React.Fragment key={index}>{part}</React.Fragment>;
        })}
      </div>
      
      <div>
        <div className="text-label-sm text-on-surface-variant mb-sm uppercase tracking-wider">Word Bank</div>
        <div className="flex flex-wrap gap-sm">
          {payload.answer_bank.map((opt, i) => {
            const isAnswer = opt.correct_for_gaps && opt.correct_for_gaps.length > 0;
            return (
              <div 
                key={i} 
                className={clsx(
                  "px-md py-sm rounded-lg text-body-md text-on-surface shadow-sm border flex items-center gap-xs",
                  isAnswer ? "bg-primary-container/10 border-primary text-primary" : "bg-surface border-outline-variant"
                )}
              >
                {opt.text}
                {isAnswer && <span className="text-[10px] bg-primary text-on-primary px-1 rounded-full">{opt.correct_for_gaps.join(',')}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
