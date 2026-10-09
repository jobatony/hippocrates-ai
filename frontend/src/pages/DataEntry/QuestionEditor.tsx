import React, { useEffect, useState } from 'react';
import type { PastQuestion } from '../../api';
import { Loader2, Trash2, Plus } from 'lucide-react';

export interface QuestionPayload {
  exam: number;
  subject: number;
  year: number;
  number: number;
  question_text: string;
  has_diagram: boolean;
  options: { letter: string; text: string; is_correct: boolean }[];
}

interface QuestionEditorProps {
  exam: number;
  subject: number;
  year: number;
  number: number;
  existingQuestion?: PastQuestion;
  onSubmit: (payload: QuestionPayload) => Promise<void>;
  onCancel?: () => void;
  isValidatorMode?: boolean;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({ 
  exam, subject, year, number, existingQuestion, onSubmit, onCancel, isValidatorMode = false 
}) => {
  const [text, setText] = useState(existingQuestion?.question_text || '');
  const [hasDiagram, setHasDiagram] = useState(existingQuestion?.has_diagram || false);
  const [options, setOptions] = useState(existingQuestion?.options || [
    { letter: 'A', text: '', is_correct: true },
    { letter: 'B', text: '', is_correct: false },
    { letter: 'C', text: '', is_correct: false },
    { letter: 'D', text: '', is_correct: false },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setText(existingQuestion?.question_text || '');
    setHasDiagram(existingQuestion?.has_diagram || false);
    setOptions(existingQuestion?.options || [
      { letter: 'A', text: '', is_correct: true },
      { letter: 'B', text: '', is_correct: false },
      { letter: 'C', text: '', is_correct: false },
      { letter: 'D', text: '', is_correct: false },
    ]);
  }, [existingQuestion, number]);

  // Questions pending validation CAN be edited. Approved cannot be edited.
  const readOnly = existingQuestion?.status === 'approved';

  const handleAddOption = () => {
    const nextLetter = String.fromCharCode(65 + options.length);
    setOptions([...options, { letter: nextLetter, text: '', is_correct: false }]);
  };

  const handleRemoveOption = (index: number) => {
    const newOpts = [...options];
    newOpts.splice(index, 1);
    newOpts.forEach((opt, idx) => {
      opt.letter = String.fromCharCode(65 + idx);
    });
    if (newOpts.length > 0 && !newOpts.some(o => o.is_correct)) {
      newOpts[0].is_correct = true;
    }
    setOptions(newOpts);
  };

  const handleSubmit = async () => {
    if (options.length < 2) {
      alert("A question must have at least 2 options.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        exam, subject, year, number,
        question_text: text,
        has_diagram: hasDiagram,
        options
      });
    } catch (e) {
      alert("Failed to save: " + e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <h2 className="font-display-sm">Question {number} ({year})</h2>
      
      {existingQuestion?.status === 'changes_requested' && !isValidatorMode && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl">
          <strong className="font-bold">Validator Feedback:</strong>
          <p>{existingQuestion.validator_feedback}</p>
        </div>
      )}

      <div>
        <label className="font-label-md text-on-surface-variant">Question Text</label>
        <textarea 
          readOnly={readOnly}
          className="w-full mt-2 bg-surface border border-outline-variant rounded-xl p-4 min-h-[150px]"
          value={text} onChange={e => setText(e.target.value)}
        />
        
        <label className="flex items-center gap-2 mt-4 cursor-pointer">
          <input 
            type="checkbox" 
            disabled={readOnly}
            checked={hasDiagram}
            onChange={e => setHasDiagram(e.target.checked)}
            className="w-5 h-5 text-primary"
          />
          <span className="font-title-sm text-on-surface">Question has image / diagram</span>
        </label>
      </div>

      <div>
        <label className="font-label-md text-on-surface-variant mb-2 block">Options</label>
        {options.map((opt, idx) => (
          <div key={opt.letter} className="flex items-center gap-3 mb-3">
            <span className="font-title-md w-6">{opt.letter}.</span>
            <input 
              type="text"
              readOnly={readOnly}
              className="flex-1 bg-surface border border-outline-variant rounded-lg p-3"
              value={opt.text}
              onChange={e => {
                const newOpts = [...options];
                newOpts[idx].text = e.target.value;
                setOptions(newOpts);
              }}
            />
            {!readOnly && options.length > 2 && (
              <button
                onClick={() => handleRemoveOption(idx)}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-error-container hover:text-error transition-colors"
                title="Remove Option"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        ))}

        {!readOnly && options.length < 10 && (
          <button
            onClick={handleAddOption}
            className="mt-2 flex items-center gap-2 text-primary font-title-sm hover:underline"
          >
            <Plus size={18} />
            Add Option
          </button>
        )}
      </div>

      {!readOnly && (
        <div className="mt-4 flex gap-4">
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-primary text-on-primary rounded-xl font-title-md hover:brightness-110 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save Question'}
          </button>
          {onCancel && (
            <button 
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-3 bg-surface-variant text-on-surface-variant rounded-xl font-title-md hover:brightness-95 flex items-center justify-center"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
};
