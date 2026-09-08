import React, { useState } from 'react';
import type { Question, MCQPayload, TrueFalsePayload, FillInPayload } from '../store/useStore';
import { updateQuestionPayload } from '../api';
import { useStore } from '../store/useStore';
import { X, Save, Plus, Trash2 } from 'lucide-react';

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

  const renderFillInForm = () => {
    const fi = payload as FillInPayload;
    return (
      <div className="space-y-md">
        <div>
          <label className="block text-label-md text-on-surface-variant mb-xs">Question Text</label>
          <p className="text-label-sm text-on-surface-variant opacity-70 mb-sm">
            Use <code>{'{gap_0}'}</code>, <code>{'{gap_1}'}</code>, etc., to indicate where blanks should be.
          </p>
          <textarea
            value={fi.question_text}
            onChange={e => setPayload({ ...fi, question_text: e.target.value })}
            className="w-full min-h-[120px] p-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-label-md text-on-surface-variant mb-xs">Answer Bank</label>
          <div className="space-y-sm">
            {fi.answer_bank.map((opt, i) => (
              <div key={i} className="flex gap-sm items-start">
                <div className="flex-1">
                  <label className="text-label-sm text-on-surface-variant block mb-1">Option Text</label>
                  <input
                    type="text"
                    value={opt.text}
                    onChange={e => {
                      const newBank = [...fi.answer_bank];
                      newBank[i].text = e.target.value;
                      setPayload({ ...fi, answer_bank: newBank });
                    }}
                    className="w-full p-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="w-32 shrink-0">
                  <label className="text-label-sm text-on-surface-variant block mb-1">Target Gaps (CSV)</label>
                  <input
                    type="text"
                    value={opt.correct_for_gaps.join(', ')}
                    onChange={e => {
                      const newBank = [...fi.answer_bank];
                      // parse CSV to numbers
                      const val = e.target.value;
                      const nums = val.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
                      newBank[i].correct_for_gaps = nums;
                      setPayload({ ...fi, answer_bank: newBank });
                    }}
                    placeholder="e.g. 0, 1"
                    className="w-full p-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary"
                  />
                </div>
                <button
                  onClick={() => setPayload({ ...fi, answer_bank: fi.answer_bank.filter((_, idx) => idx !== i) })}
                  className="mt-6 p-xs text-error hover:bg-error-container rounded transition-colors shrink-0"
                  title="Remove option"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setPayload({ ...fi, answer_bank: [...fi.answer_bank, { text: 'New Option', correct_for_gaps: [] }] })}
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
