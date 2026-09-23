import React, { useMemo } from 'react';
import type { FillInPayload } from '../store/useStore';
import clsx from 'clsx';
import { Plus, Minus, ArrowDown } from 'lucide-react';

interface Props {
  payload: FillInPayload;
  isEditing: boolean;
  onChange: (newPayload: FillInPayload) => void;
}

/** Extract ordered gap indices present in the question text */
function extractGaps(text: string): number[] {
  const matches = [...text.matchAll(/\{gap_(\d+)\}/g)];
  const seen = new Set<number>();
  const result: number[] = [];
  for (const m of matches) {
    const n = parseInt(m[1], 10);
    if (!seen.has(n)) { seen.add(n); result.push(n); }
  }
  return result.sort((a, b) => a - b);
}

/** Insert a new gap placeholder at the end of the text */
function appendGap(text: string, gapIndex: number): string {
  return text.trimEnd() + ` {gap_${gapIndex}}`;
}

/**
 * Remove a gap from the question text and answer_bank, then
 * re-number all remaining gaps to be contiguous (0, 1, 2, …).
 */
function removeGapAndRenumber(payload: FillInPayload, removedGap: number): FillInPayload {
  // 1. Build a renumbering map: old gap index → new gap index (skipping the removed one)
  const allGaps = extractGaps(payload.question_text);
  const remaining = allGaps.filter(g => g !== removedGap).sort((a, b) => a - b);
  const remap: Record<number, number> = {};
  remaining.forEach((old, newIdx) => { remap[old] = newIdx; });

  // 2. Replace all {gap_N} tokens in the question text
  let newText = payload.question_text.replace(/\{gap_(\d+)\}/g, (_match, num) => {
    const n = parseInt(num, 10);
    if (n === removedGap) return ''; // erase the removed gap
    return `{gap_${remap[n] ?? n}}`;
  });
  // Clean up any double-spaces left behind
  newText = newText.replace(/  +/g, ' ').trim();

  // 3. Update answer_bank: drop options whose only gap was the removed one, remap others
  const newBank = payload.answer_bank
    .map(opt => ({
      ...opt,
      correct_for_gaps: opt.correct_for_gaps
        .filter(g => g !== removedGap)
        .map(g => remap[g] ?? g),
    }))
    .filter(opt => opt.correct_for_gaps.length > 0 || payload.answer_bank.find(o => o.text === opt.text && o.correct_for_gaps.length === 0));
  // Keep distractors (correct_for_gaps: []) as-is

  return { ...payload, question_text: newText, answer_bank: newBank, gap_count: remaining.length };
}

export const FillInRenderer: React.FC<Props> = ({ payload, isEditing, onChange }) => {
  const gaps = useMemo(() => extractGaps(payload.question_text), [payload.question_text]);

  if (isEditing) {
    const handleAddGap = () => {
      const nextIndex = gaps.length > 0 ? Math.max(...gaps) + 1 : 0;
      const newText = appendGap(payload.question_text, nextIndex);
      onChange({ ...payload, question_text: newText, gap_count: gaps.length + 1 });
    };

    const handleRemoveGap = (gapIndex: number) => {
      onChange(removeGapAndRenumber(payload, gapIndex));
    };

    const handleBankTextChange = (i: number, text: string) => {
      const newBank = payload.answer_bank.map((opt, idx) =>
        idx === i ? { ...opt, text } : opt
      );
      onChange({ ...payload, answer_bank: newBank });
    };

    const handleBankGapChange = (i: number, gapIndex: number, assigned: boolean) => {
      const newBank = payload.answer_bank.map((opt, idx) => {
        if (idx !== i) return opt;
        const existing = opt.correct_for_gaps.filter(g => g !== gapIndex);
        return { ...opt, correct_for_gaps: assigned ? [...existing, gapIndex].sort((a, b) => a - b) : existing };
      });
      onChange({ ...payload, answer_bank: newBank });
    };

    const handleAddBankItem = () => {
      onChange({ ...payload, answer_bank: [...payload.answer_bank, { text: '', correct_for_gaps: [] }] });
    };

    const handleRemoveBankItem = (i: number) => {
      onChange({ ...payload, answer_bank: payload.answer_bank.filter((_, idx) => idx !== i) });
    };

    return (
      <div className="space-y-md">
        {/* ── Question text ── */}
        <div>
          <label className="block text-label-sm text-on-surface-variant mb-xs font-bold uppercase tracking-wider">
            Question Text
          </label>
          <p className="text-[11px] text-on-surface-variant opacity-70 mb-xs">
            Gaps are marked as <code className="bg-surface-container-high px-1 rounded font-mono">{'{gap_0}'}</code>,{' '}
            <code className="bg-surface-container-high px-1 rounded font-mono">{'{gap_1}'}</code>, etc. Use the buttons below to add/remove gaps.
          </p>
          <textarea
            value={payload.question_text}
            onChange={e => {
              const newGaps = extractGaps(e.target.value);
              onChange({ ...payload, question_text: e.target.value, gap_count: newGaps.length });
            }}
            rows={4}
            className="w-full p-sm bg-surface rounded-lg border border-outline text-body-sm text-on-surface focus:outline-none focus:border-primary font-mono resize-none"
          />

          {/* Gap chips */}
          <div className="flex flex-wrap gap-xs mt-sm items-center">
            <span className="text-label-xs text-on-surface-variant uppercase tracking-wider mr-xs">Gaps detected:</span>
            {gaps.length === 0 && (
              <span className="text-label-xs text-on-surface-variant opacity-50 italic">None yet</span>
            )}
            {gaps.map(g => (
              <div
                key={g}
                className="flex items-center gap-[3px] bg-primary/10 text-primary text-label-sm px-sm py-[2px] rounded-full border border-primary/20"
              >
                <span>Gap {g}</span>
                <button
                  onClick={() => handleRemoveGap(g)}
                  className="hover:bg-primary/20 rounded-full p-[1px] transition-colors"
                  title={`Remove Gap ${g}`}
                >
                  <Minus size={10} />
                </button>
              </div>
            ))}
            <button
              onClick={handleAddGap}
              className="flex items-center gap-xs text-primary text-label-sm border border-primary/30 px-sm py-[2px] rounded-full hover:bg-primary/10 transition-colors"
            >
              <Plus size={12} /> Add Gap {gaps.length > 0 ? gaps.length : 0}
            </button>
          </div>
        </div>

        {/* ── Answer bank ── */}
        <div>
          <label className="block text-label-sm text-on-surface-variant mb-xs font-bold uppercase tracking-wider">
            Answer Bank
          </label>
          <p className="text-[11px] text-on-surface-variant opacity-70 mb-sm">
            For each answer option, type the text and tick which gap(s) it correctly fills. Leave all gaps unchecked to mark it as a distractor.
          </p>

          <div className="space-y-sm">
            {payload.answer_bank.map((opt, i) => (
              <div
                key={i}
                className="flex items-start gap-sm bg-surface rounded-lg border border-outline-variant p-sm"
              >
                {/* Answer text */}
                <input
                  type="text"
                  value={opt.text}
                  onChange={e => handleBankTextChange(i, e.target.value)}
                  placeholder="Answer text…"
                  className="flex-1 min-w-0 p-xs bg-surface-container-lowest rounded border border-outline focus:outline-none focus:border-primary text-body-sm"
                />

                {/* Gap assignment checkboxes */}
                <div className="flex flex-wrap gap-sm shrink-0 items-center">
                  {gaps.length === 0 ? (
                    <span className="text-label-xs text-on-surface-variant opacity-50 italic">No gaps</span>
                  ) : (
                    gaps.map(g => (
                      <label key={g} className="flex items-center gap-[4px] cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={opt.correct_for_gaps.includes(g)}
                          onChange={e => handleBankGapChange(i, g, e.target.checked)}
                          className="w-4 h-4 accent-primary rounded cursor-pointer"
                        />
                        <span className="text-label-xs text-on-surface-variant font-mono">Gap {g}</span>
                      </label>
                    ))
                  )}
                </div>

                {/* Remove button */}
                <button
                  onClick={() => handleRemoveBankItem(i)}
                  className="text-error hover:bg-error-container p-1 rounded shrink-0 transition-colors"
                  title="Remove this option"
                >
                  <Minus size={14} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddBankItem}
            className="mt-sm w-full py-xs flex items-center justify-center gap-xs text-primary text-label-sm border border-dashed border-primary/40 hover:bg-primary/5 rounded-lg transition-colors"
          >
            <Plus size={14} /> Add Answer Option
          </button>
        </div>

        {/* ── Live preview ── */}
        {gaps.length > 0 && (
          <div className="border border-outline-variant rounded-lg p-sm bg-surface-container-lowest">
            <div className="text-label-xs text-on-surface-variant uppercase tracking-wider mb-xs flex items-center gap-xs">
              <ArrowDown size={11} /> Preview
            </div>
            <div className="text-body-sm text-on-surface leading-relaxed">
              {payload.question_text.split(/(\{gap_\d+\})/g).map((part, idx) => {
                const match = part.match(/\{gap_(\d+)\}/);
                if (match) {
                  const gapNum = parseInt(match[1]);
                  // Find the correct answer for this gap for the preview
                  const correctOpt = payload.answer_bank.find(o => o.correct_for_gaps.includes(gapNum));
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center justify-center min-w-[60px] h-6 mx-[3px] bg-primary/10 text-primary text-label-sm px-sm rounded border border-primary/30 font-medium align-middle"
                    >
                      {correctOpt?.text || `Gap ${gapNum}`}
                    </span>
                  );
                }
                return <span key={idx}>{part}</span>;
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Read-only view ──
  const parts = payload.question_text?.split(/(\{gap_\d+\})/g) || [];

  return (
    <div>
      <div className="font-body-md text-on-surface mb-lg leading-loose bg-surface p-md rounded-lg shadow-inner">
        {parts.map((part: string, index: number) => {
          if (part.match(/^\{gap_\d+\}$/)) {
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
                  'px-md py-sm rounded-lg text-body-md text-on-surface shadow-sm border flex items-center gap-xs max-w-full break-words whitespace-normal',
                  isAnswer ? 'bg-primary-container/10 border-primary text-primary' : 'bg-surface border-outline-variant'
                )}
              >
                <span className="break-words min-w-0">{opt.text}</span>
                {isAnswer && (
                  <span className="text-[10px] bg-primary text-on-primary px-1 rounded-full shrink-0">
                    {opt.correct_for_gaps.map(g => `Gap ${g}`).join(', ')}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
