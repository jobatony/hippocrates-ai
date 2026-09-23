import React from 'react';
import { Plus, Minus, CheckCircle2, XCircle } from 'lucide-react';

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
  if (isEditing) {
    const handleCorrectChange = (i: number, value: string) => {
      const updated = [...payload.correct_options];
      updated[i] = value;
      onChange({ ...payload, correct_options: updated });
    };

    const handleWrongChange = (i: number, value: string) => {
      const updated = [...payload.wrong_options];
      updated[i] = value;
      onChange({ ...payload, wrong_options: updated });
    };

    const handleAddCorrect = () => {
      onChange({ ...payload, correct_options: [...payload.correct_options, ''] });
    };

    const handleAddWrong = () => {
      onChange({ ...payload, wrong_options: [...payload.wrong_options, ''] });
    };

    const handleRemoveCorrect = (i: number) => {
      onChange({ ...payload, correct_options: payload.correct_options.filter((_, idx) => idx !== i) });
    };

    const handleRemoveWrong = (i: number) => {
      onChange({ ...payload, wrong_options: payload.wrong_options.filter((_, idx) => idx !== i) });
    };

    /**
     * "Flip" an option between correct and wrong. This is the key UX improvement:
     * instead of editing two separate textareas, users can toggle individual items.
     */
    const flipToWrong = (i: number) => {
      const opt = payload.correct_options[i];
      onChange({
        ...payload,
        correct_options: payload.correct_options.filter((_, idx) => idx !== i),
        wrong_options: [...payload.wrong_options, opt],
      });
    };

    const flipToCorrect = (i: number) => {
      const opt = payload.wrong_options[i];
      onChange({
        ...payload,
        wrong_options: payload.wrong_options.filter((_, idx) => idx !== i),
        correct_options: [...payload.correct_options, opt],
      });
    };

    return (
      <div className="space-y-md text-body-sm">
        {/* Question */}
        <div>
          <label className="block text-label-sm text-on-surface-variant mb-xs font-bold uppercase tracking-wider">
            Question
          </label>
          <textarea
            rows={2}
            className="w-full bg-surface border border-outline-variant rounded-lg px-sm py-xs text-body-sm focus:outline-none focus:border-primary resize-none"
            value={payload.question}
            onChange={e => onChange({ ...payload, question: e.target.value })}
          />
        </div>

        {/* Options — unified list */}
        <div>
          <label className="block text-label-sm text-on-surface-variant mb-xs font-bold uppercase tracking-wider">
            Options
          </label>
          <p className="text-[11px] text-on-surface-variant opacity-70 mb-sm">
            Click the <CheckCircle2 className="inline w-3 h-3 text-green-600" /> / <XCircle className="inline w-3 h-3 text-red-500" /> icon to toggle whether an option is correct or a distractor.
          </p>

          {/* Correct options */}
          <div className="space-y-xs mb-sm">
            {payload.correct_options.map((opt, i) => (
              <div key={`c-${i}`} className="flex items-center gap-sm">
                {/* Correct/Wrong toggle */}
                <button
                  type="button"
                  onClick={() => flipToWrong(i)}
                  title="Mark as distractor"
                  className="shrink-0 text-green-600 hover:text-red-500 transition-colors"
                >
                  <CheckCircle2 size={18} />
                </button>
                <input
                  type="text"
                  value={opt}
                  onChange={e => handleCorrectChange(i, e.target.value)}
                  placeholder="Correct option…"
                  className="flex-1 min-w-0 px-sm py-xs bg-surface border border-green-300 rounded-lg text-body-sm focus:outline-none focus:border-green-500"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveCorrect(i)}
                  className="text-error hover:bg-error-container p-1 rounded shrink-0 transition-colors"
                  title="Remove"
                >
                  <Minus size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Wrong / distractor options */}
          <div className="space-y-xs mb-sm">
            {payload.wrong_options.map((opt, i) => (
              <div key={`w-${i}`} className="flex items-center gap-sm">
                <button
                  type="button"
                  onClick={() => flipToCorrect(i)}
                  title="Mark as correct"
                  className="shrink-0 text-red-500 hover:text-green-600 transition-colors"
                >
                  <XCircle size={18} />
                </button>
                <input
                  type="text"
                  value={opt}
                  onChange={e => handleWrongChange(i, e.target.value)}
                  placeholder="Distractor option…"
                  className="flex-1 min-w-0 px-sm py-xs bg-surface border border-red-200 rounded-lg text-body-sm focus:outline-none focus:border-red-400"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveWrong(i)}
                  className="text-error hover:bg-error-container p-1 rounded shrink-0 transition-colors"
                  title="Remove"
                >
                  <Minus size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Add buttons */}
          <div className="flex gap-sm mt-xs">
            <button
              type="button"
              onClick={handleAddCorrect}
              className="flex-1 py-xs flex items-center justify-center gap-xs text-green-700 text-label-sm border border-dashed border-green-400 hover:bg-green-50 rounded-lg transition-colors"
            >
              <Plus size={13} /> Add Correct
            </button>
            <button
              type="button"
              onClick={handleAddWrong}
              className="flex-1 py-xs flex items-center justify-center gap-xs text-red-600 text-label-sm border border-dashed border-red-300 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Plus size={13} /> Add Distractor
            </button>
          </div>
        </div>

        {/* Live counts */}
        <p className="text-label-xs text-on-surface-variant opacity-70">
          {payload.correct_options.length} correct answer{payload.correct_options.length !== 1 ? 's' : ''} · {payload.wrong_options.length} distractor{payload.wrong_options.length !== 1 ? 's' : ''}
        </p>
      </div>
    );
  }

  // ── Read-only view (combined shuffled preview) ──
  const allOptions = [
    ...payload.correct_options.map(o => ({ text: o, correct: true })),
    ...payload.wrong_options.map(o => ({ text: o, correct: false })),
  ];

  return (
    <div className="space-y-sm text-body-sm">
      <p className="font-medium text-on-surface">{payload.question}</p>
      <div className="space-y-xs">
        {allOptions.map((opt, i) => (
          <div
            key={i}
            className="px-sm py-xs rounded border text-label-sm flex items-start gap-xs max-w-full break-words whitespace-normal"
          >
            <span className="flex-1 min-w-0 break-words">{opt.text}</span>
            <span className="shrink-0 text-xs opacity-60 mt-[2px]">{opt.correct ? '✓' : '✗'}</span>
          </div>
        ))}
      </div>
      <p className="text-label-xs text-on-surface-variant">
        {payload.correct_options.length} correct + {payload.wrong_options.length} distractors
      </p>
    </div>
  );
};
