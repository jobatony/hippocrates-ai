import React, { useEffect, useState } from 'react';
import type { PastQuestion } from '../../api';
import { Loader2 } from 'lucide-react';

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

  const handleSubmit = async () => {
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
            <input 
              type="radio" 
              name={`correct_option_${number}`} 
              checked={opt.is_correct}
              disabled={readOnly}
              onChange={() => {
                const newOpts = [...options];
                newOpts.forEach(o => o.is_correct = false);
                newOpts[idx].is_correct = true;
                setOptions(newOpts);
              }}
              className="w-5 h-5 text-primary"
            />
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
          </div>
        ))}
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
