import React, { useState } from 'react';
import type { Question, MCQPayload, TrueFalsePayload, FillInPayload } from '../store/useStore';
import { updateQuestionPayload } from '../api';
import { useStore } from '../store/useStore';
import { X, Save, Plus, Trash2, Minus } from 'lucide-react';

interface Props {
  question: Question;
  onClose: () => void;
}

export const EditQuestionModal: React.FC<Props> = ({ question, onClose }) => {
  const { updateQuestionPayload: storeUpdatePayload } = useStore();
  
  // Clone the payload so we can safely mutate state
  const [payload, setPayload] = useState<any>(JSON.parse(JSON.stringify(question.payload)));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setError(null);
      setSaving(true);
      
      const finalPayload = { ...payload };

      // Auto-calculate gap_count for fill_in just to be safe
      if (question.type === 'fill_in') {
        const matches = [...finalPayload.question_text.matchAll(/\{gap_(\d+)\}/g)];
        let maxGap = -1;
        matches.forEach(m => {
          const num = parseInt(m[1], 10);
          if (num > maxGap) maxGap = num;
        });
        finalPayload.gap_count = maxGap + 1;
      }

      await updateQuestionPayload(question.id, finalPayload);
      storeUpdatePayload(question.id, finalPayload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const renderMCQForm = () => {
    const mcq = payload as MCQPayload;
    return (
      <div className="space-y-md">
        <div>
          <label className="block text-label-md text-on-surface-variant mb-xs">Question</label>
          <textarea
            value={mcq.question}
            onChange={e => setPayload({ ...mcq, question: e.target.value })}
            className="w-full min-h-[80px] p-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary"
          />
        </div>
        
        <div>
          <label className="block text-label-md text-on-surface-variant mb-xs">Options (Select the correct one)</label>
          <div className="space-y-sm">
            {mcq.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-sm">
                <input
                  type="radio"
                  name="correct_option"
                  checked={mcq.correct_index === i}
                  onChange={() => setPayload({ ...mcq, correct_index: i })}
                  className="w-5 h-5 cursor-pointer accent-primary shrink-0"
                />
                <input
                  type="text"
                  value={opt}
                  onChange={e => {
                    const newOpts = [...mcq.options];
                    newOpts[i] = e.target.value;
                    setPayload({ ...mcq, options: newOpts });
                  }}
                  className="flex-1 p-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary"
                />
                <button
                  onClick={() => {
                    const newOpts = mcq.options.filter((_, idx) => idx !== i);
                    let newIndex = mcq.correct_index;
                    if (newIndex === i) newIndex = 0; // fallback if deleted correct
                    else if (newIndex > i) newIndex -= 1;
                    setPayload({ ...mcq, options: newOpts, correct_index: newIndex });
                  }}
                  className="p-xs text-error hover:bg-error-container rounded transition-colors shrink-0"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setPayload({ ...mcq, options: [...mcq.options, 'New Option'] })}
            className="mt-sm flex items-center gap-xs text-primary text-label-sm font-bold hover:underline"
          >
            <Plus size={16} /> Add Option
          </button>
        </div>

        <div>
          <label className="block text-label-md text-on-surface-variant mb-xs">Explanation</label>
          <textarea
            value={mcq.explanation}
            onChange={e => setPayload({ ...mcq, explanation: e.target.value })}
            className="w-full min-h-[80px] p-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary"
          />
        </div>
      </div>
    );
  };

  const renderTrueFalseForm = () => {
    const tf = payload as TrueFalsePayload;
    return (
      <div className="space-y-md">
        <div>
          <label className="block text-label-md text-on-surface-variant mb-xs">Stem</label>
          <textarea
            value={tf.stem}
            onChange={e => setPayload({ ...tf, stem: e.target.value })}
            className="w-full min-h-[80px] p-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-label-md text-on-surface-variant mb-xs">Statements</label>
          <div className="space-y-md">
            {tf.statements.map((stmt, i) => (
              <div key={i} className="flex flex-col gap-xs p-md border border-outline-variant rounded-lg relative bg-surface-container-lowest">
                <button
                  onClick={() => setPayload({ ...tf, statements: tf.statements.filter((_, idx) => idx !== i) })}
                  className="absolute top-2 right-2 p-xs text-error hover:bg-error-container rounded transition-colors"
                >
                  <Trash2 size={16} />
                </button>
                <div className="pr-xl">
                  <label className="text-label-sm text-green-600 block mb-1">True Statement</label>
                  <input
                    type="text"
                    value={stmt.true_statement}
                    onChange={e => {
                      const newStmts = [...tf.statements];
                      newStmts[i].true_statement = e.target.value;
                      setPayload({ ...tf, statements: newStmts });
                    }}
                    className="w-full p-sm bg-surface border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="pr-xl mt-xs">
                  <label className="text-label-sm text-red-600 block mb-1">False Alternative</label>
                  <input
                    type="text"
                    value={stmt.false_alternative}
                    onChange={e => {
                      const newStmts = [...tf.statements];
                      newStmts[i].false_alternative = e.target.value;
                      setPayload({ ...tf, statements: newStmts });
                    }}
                    className="w-full p-sm bg-surface border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setPayload({ ...tf, statements: [...tf.statements, { true_statement: 'New True', false_alternative: 'New False' }] })}
            className="mt-sm flex items-center gap-xs text-primary text-label-sm font-bold hover:underline"
          >
            <Plus size={16} /> Add Statement Pair
          </button>
        </div>
      </div>
    );
  };

  /** Extract ordered, unique gap indices from the question text */
  const extractGaps = (text: string): number[] => {
    const matches = [...text.matchAll(/\{gap_(\d+)\}/g)];
    const seen = new Set<number>();
    const result: number[] = [];
    for (const m of matches) {
      const n = parseInt(m[1], 10);
      if (!seen.has(n)) { seen.add(n); result.push(n); }
    }
    return result.sort((a, b) => a - b);
  };

  /** Remove a gap and renumber the remaining ones in both text and answer_bank */
  const removeGapAndRenumber = (fi: any, removedGap: number): any => {
    const allGaps = extractGaps(fi.question_text);
    const remaining = allGaps.filter((g: number) => g !== removedGap).sort((a: number, b: number) => a - b);
    const remap: Record<number, number> = {};
    remaining.forEach((old: number, newIdx: number) => { remap[old] = newIdx; });

    let newText = fi.question_text.replace(/\{gap_(\d+)\}/g, (_: string, num: string) => {
      const n = parseInt(num, 10);
      if (n === removedGap) return '';
      return `{gap_${remap[n] ?? n}}`;
    });
    newText = newText.replace(/  +/g, ' ').trim();

    const newBank = fi.answer_bank.map((opt: any) => ({
      ...opt,
      correct_for_gaps: opt.correct_for_gaps
        .filter((g: number) => g !== removedGap)
        .map((g: number) => remap[g] ?? g),
    }));

    return { ...fi, question_text: newText, answer_bank: newBank, gap_count: remaining.length };
  };

  const renderFillInForm = () => {
    const fi = payload as FillInPayload;
    const gaps = extractGaps(fi.question_text);

    const handleAddGap = () => {
      const nextIndex = gaps.length > 0 ? Math.max(...gaps) + 1 : 0;
      const newText = fi.question_text.trimEnd() + ` {gap_${nextIndex}}`;
      setPayload({ ...fi, question_text: newText, gap_count: gaps.length + 1 });
    };

    const handleRemoveGap = (gapIndex: number) => {
      setPayload(removeGapAndRenumber(fi, gapIndex));
    };

    const handleBankGapToggle = (i: number, gapIndex: number, assigned: boolean) => {
      const newBank = fi.answer_bank.map((opt: any, idx: number) => {
        if (idx !== i) return opt;
        const existing = opt.correct_for_gaps.filter((g: number) => g !== gapIndex);
        return { ...opt, correct_for_gaps: assigned ? [...existing, gapIndex].sort((a: number, b: number) => a - b) : existing };
      });
      setPayload({ ...fi, answer_bank: newBank });
    };

    return (
      <div className="space-y-md">
        {/* Question Text */}
        <div>
          <label className="block text-label-md text-on-surface-variant mb-xs">Question Text</label>
          <p className="text-[11px] text-on-surface-variant opacity-70 mb-sm">
            Gaps appear as <code className="bg-surface-container-high px-1 rounded font-mono">{'{gap_0}'}</code>,{' '}
            <code className="bg-surface-container-high px-1 rounded font-mono">{'{gap_1}'}</code>, etc. Use the buttons below to manage gaps.
          </p>
          <textarea
            value={fi.question_text}
            onChange={e => {
              const newGaps = extractGaps(e.target.value);
              setPayload({ ...fi, question_text: e.target.value, gap_count: newGaps.length });
            }}
            className="w-full min-h-[120px] p-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary font-mono"
          />

          {/* Gap chips */}
          <div className="flex flex-wrap gap-xs mt-sm items-center">
            <span className="text-label-xs text-on-surface-variant uppercase tracking-wider mr-xs">Gaps detected:</span>
            {gaps.length === 0 && <span className="text-label-xs text-on-surface-variant opacity-50 italic">None</span>}
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

        {/* Answer Bank */}
        <div>
          <label className="block text-label-md text-on-surface-variant mb-xs">Answer Bank</label>
          <p className="text-[11px] text-on-surface-variant opacity-70 mb-sm">
            Tick which gap each option correctly fills. Leave all unchecked for distractors.
          </p>
          <div className="space-y-sm">
            {fi.answer_bank.map((opt: any, i: number) => (
              <div key={i} className="flex items-start gap-sm bg-surface-container-lowest rounded-lg border border-outline-variant p-sm">
                <input
                  type="text"
                  value={opt.text}
                  onChange={e => {
                    const newBank = [...fi.answer_bank];
                    newBank[i] = { ...newBank[i], text: e.target.value };
                    setPayload({ ...fi, answer_bank: newBank });
                  }}
                  placeholder="Answer text…"
                  className="flex-1 min-w-0 p-sm bg-surface border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary"
                />
                <div className="flex flex-wrap gap-sm shrink-0 items-center pt-[6px]">
                  {gaps.length === 0 ? (
                    <span className="text-label-xs text-on-surface-variant opacity-50 italic">No gaps</span>
                  ) : (
                    gaps.map(g => (
                      <label key={g} className="flex items-center gap-[4px] cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={opt.correct_for_gaps.includes(g)}
                          onChange={e => handleBankGapToggle(i, g, e.target.checked)}
                          className="w-4 h-4 accent-primary rounded cursor-pointer"
                        />
                        <span className="text-label-xs text-on-surface-variant font-mono">Gap {g}</span>
                      </label>
                    ))
                  )}
                </div>
                <button
                  onClick={() => setPayload({ ...fi, answer_bank: fi.answer_bank.filter((_: any, idx: number) => idx !== i) })}
                  className="mt-1 p-xs text-error hover:bg-error-container rounded transition-colors shrink-0"
                  title="Remove option"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setPayload({ ...fi, answer_bank: [...fi.answer_bank, { text: '', correct_for_gaps: [] }] })}
            className="mt-sm flex items-center gap-xs text-primary text-label-sm font-bold hover:underline"
          >
            <Plus size={16} /> Add Answer Option
          </button>
        </div>
      </div>
    );
  };


  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
      <div className="bg-surface-container rounded-2xl p-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-lg shrink-0">
          <h2 className="font-headline-md text-on-surface flex items-center gap-sm">
            Edit Question
            <span className="bg-surface-container-high px-sm py-xs rounded text-label-sm text-on-surface-variant border border-outline-variant uppercase">
              {question.type.replace('_', ' ')}
            </span>
          </h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-xs transition-colors rounded hover:bg-surface-container-high">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto mb-lg pr-sm">
          {question.type === 'mcq' && renderMCQForm()}
          {question.type === 'true_false' && renderTrueFalseForm()}
          {question.type === 'fill_in' && renderFillInForm()}
          
          {error && (
            <div className="mt-md p-sm bg-error-container text-on-error-container rounded text-label-sm">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-md shrink-0 pt-md border-t border-outline-variant">
          <button 
            onClick={onClose}
            className="px-lg py-sm text-on-surface hover:bg-surface-container-high rounded-full font-label-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-lg py-sm bg-primary text-on-primary rounded-full font-label-lg flex items-center gap-xs disabled:opacity-50 transition-colors hover:bg-primary-container"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
