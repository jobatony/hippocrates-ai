import React from 'react';
import type { MCQPayload } from '../store/useStore';
import clsx from 'clsx';
import { Minus, Plus } from 'lucide-react';

interface Props {
  payload: MCQPayload;
  isEditing: boolean;
  onChange: (newPayload: MCQPayload) => void;
}

export const MCQRenderer: React.FC<Props> = ({ payload, isEditing, onChange }) => {
  if (isEditing) {
    return (
      <div className="space-y-sm">
        <textarea
          value={payload.question}
          onChange={e => onChange({ ...payload, question: e.target.value })}
          className="w-full p-sm bg-surface rounded border border-outline text-body-md text-on-surface focus:outline-none focus:border-primary resize-none"
          rows={3}
          placeholder="Question Text"
        />
        
        <div className="space-y-xs">
          {payload.options.map((option, i) => (
            <div key={i} className="flex items-center gap-sm">
              <input 
                type="radio" 
                name="correct_index"
                checked={payload.correct_index === i}
                onChange={() => onChange({ ...payload, correct_index: i })}
                className="w-4 h-4 text-primary"
              />
              <input
                type="text"
                value={option}
                onChange={e => {
                  const newOptions = [...payload.options];
                  newOptions[i] = e.target.value;
                  onChange({ ...payload, options: newOptions });
                }}
                className="flex-1 min-w-0 p-sm bg-surface rounded border border-outline text-body-md focus:outline-none focus:border-primary"
                placeholder={`Option ${i + 1}`}
              />
              {payload.options.length > 2 && (
                <button
                  onClick={() => {
                    const newOptions = payload.options.filter((_, idx) => idx !== i);
                    let newCorrectIndex = payload.correct_index;
                    if (payload.correct_index === i) {
                      newCorrectIndex = 0;
                    } else if (payload.correct_index > i) {
                      newCorrectIndex -= 1;
                    }
                    onChange({ ...payload, options: newOptions, correct_index: newCorrectIndex });
                  }}
                  className="text-error hover:bg-error-container p-1 rounded shrink-0"
                  title="Remove option"
                >
                  <Minus size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        
        <button
          onClick={() => onChange({
            ...payload, 
            options: [...payload.options, '']
          })}
          className="w-full py-xs mt-sm flex items-center justify-center gap-xs text-primary text-label-sm hover:bg-primary-container/20 rounded transition-colors"
        >
          <Plus size={14} /> Add Option
        </button>
        
        <textarea
          value={payload.explanation}
          onChange={e => onChange({ ...payload, explanation: e.target.value })}
          className="w-full p-sm bg-surface rounded border border-outline text-body-md text-on-surface focus:outline-none focus:border-primary resize-none mt-sm"
          rows={2}
          placeholder="Explanation"
        />
      </div>
    );
  }

  return (
    <div>
      <p className="font-body-md text-on-surface mb-md">{payload.question}</p>
      
      <div className="space-y-sm">
        {payload.options.map((option: string, i: number) => {
          const isSelected = i === payload.correct_index;
          return (
            <div key={i} className={clsx(
              "flex items-center gap-md p-sm rounded-lg shadow-sm border",
              isSelected 
                ? "bg-primary-container/20 border-primary text-on-primary-container font-medium" 
                : "bg-surface border-outline-variant text-on-surface-variant"
            )}>
              <div className={clsx(
                "w-4 h-4 rounded-full border-2 flex flex-shrink-0 items-center justify-center",
                isSelected ? "border-primary bg-primary" : "border-outline-variant"
              )}>
                {isSelected && <div className="w-2 h-2 rounded-full bg-on-primary"></div>}
              </div>
              <span className="text-body-md flex-1 min-w-0 break-words">{option}</span>
            </div>
          );
        })}
      </div>
      
      {payload.explanation && (
        <div className="mt-md p-sm bg-surface-container-low rounded text-body-sm text-on-surface-variant italic border-l-2 border-outline">
          {payload.explanation}
        </div>
      )}
    </div>
  );
};
