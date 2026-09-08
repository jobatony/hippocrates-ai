import React, { useState } from 'react';

interface AppliesPayload {
  question: string;
  correct_options: string[];
  wrong_options: string[];
}

interface Props {
  payload: AppliesPayload;
  isEditing: boolean;
  onChange: (updated: AppliesPayload) => void;
}

export const AppliesRenderer: React.FC<Props> = ({ payload, isEditing, onChange }) => {
  const allOptions = [...payload.correct_options, ...payload.wrong_options];
  const [shuffled] = useState(() => [...allOptions].sort(() => Math.random() - 0.5));

  if (isEditing) {
    return (
      <div className="space-y-sm text-body-sm">
        <div>
          <label className="block text-label-sm text-on-surface-variant mb-xs">Question</label>
          <input
            className="w-full bg-surface border border-outline-variant rounded px-sm py-xs text-body-sm"
            value={payload.question}
            onChange={e => onChange({ ...payload, question: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-label-sm text-on-surface-variant mb-xs">Correct Options (one per line)</label>
          <textarea
            className="w-full bg-surface border border-outline-variant rounded px-sm py-xs text-body-sm"
            rows={4}
            value={payload.correct_options.join('\n')}
            onChange={e => onChange({ ...payload, correct_options: e.target.value.split('\n').filter(Boolean) })}
          />
        </div>
        <div>
          <label className="block text-label-sm text-on-surface-variant mb-xs">Wrong Options (one per line)</label>
          <textarea
            className="w-full bg-surface border border-outline-variant rounded px-sm py-xs text-body-sm"
            rows={3}
            value={payload.wrong_options.join('\n')}
            onChange={e => onChange({ ...payload, wrong_options: e.target.value.split('\n').filter(Boolean) })}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-sm text-body-sm">
      <p className="font-medium text-on-surface">{payload.question}</p>
      <div className="space-y-xs">
        {shuffled.map((opt, i) => {
          const isCorrect = payload.correct_options.includes(opt);
          return (
            <div key={i} className="px-sm py-xs rounded border text-label-sm">
              {opt}
              <span className="ml-xs text-xs opacity-60">{isCorrect ? 'v' : 'x'}</span>
            </div>
          );
        })}
      </div>
      <p className="text-label-xs text-on-surface-variant">
        {payload.correct_options.length} correct + {payload.wrong_options.length} distractors
      </p>
    </div>
  );
};
