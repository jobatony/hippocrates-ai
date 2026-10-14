import React, { useEffect, useState } from 'react';
import type { PastQuestion } from '../../api';
import { Loader2, Trash2, Plus } from 'lucide-react';
import { AppModal } from '../../components/AppModal';

export interface QuestionPayload {
  exam: number;
  subject: number;
  year: number;
  number: number;
  question_text: string;
  has_diagram: boolean;
  options: { letter: string; text: string; is_correct: boolean | null }[];
}

interface QuestionEditorProps {
  exam: number;
  subject: number;
  year: number;
  number: number;
  existingQuestion?: PastQuestion;
  onSubmit: (payload: QuestionPayload) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel?: () => void;
  isValidatorMode?: boolean;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({ 
  exam, subject, year, number, existingQuestion, onSubmit, onDelete, onCancel, isValidatorMode = false 
}) => {
  const [text, setText] = useState(existingQuestion?.question_text || '');
  const [hasDiagram, setHasDiagram] = useState(existingQuestion?.has_diagram || false);
  const [options, setOptions] = useState<{ letter: string; text: string; is_correct: boolean | null }[]>(
    existingQuestion?.options || [
      { letter: 'A', text: '', is_correct: null },
      { letter: 'B', text: '', is_correct: null },
      { letter: 'C', text: '', is_correct: null },
      { letter: 'D', text: '', is_correct: null },
    ]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationPopup, setValidationPopup] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    setText(existingQuestion?.question_text || '');
    setHasDiagram(existingQuestion?.has_diagram || false);
    setOptions(
      existingQuestion?.options || [
        { letter: 'A', text: '', is_correct: null },
        { letter: 'B', text: '', is_correct: null },
        { letter: 'C', text: '', is_correct: null },
        { letter: 'D', text: '', is_correct: null },
      ]
    );
  }, [existingQuestion, number]);

  // Questions pending validation CAN be edited. Approved cannot be edited.
  const readOnly = existingQuestion?.status === 'approved';

  const handleAddOption = () => {
    const nextLetter = String.fromCharCode(65 + options.length);
    setOptions([...options, { letter: nextLetter, text: '', is_correct: null }]);
  };

  const handleRemoveOption = (index: number) => {
    const newOpts = [...options];
    newOpts.splice(index, 1);
    newOpts.forEach((opt, idx) => {
      opt.letter = String.fromCharCode(65 + idx);
    });
    setOptions(newOpts);
  };

  const handleSubmit = async () => {
    const trimmedText = text.trim();
    const filledOptions = options.filter(o => o.text.trim().length > 0);
    const isAllDeleted = !trimmedText && filledOptions.length === 0;

    // 1. All text deleted
    if (isAllDeleted) {
      if (existingQuestion && onDelete) {
        setIsSubmitting(true);
        try {
          await onDelete();
          setValidationPopup({
            title: "Question Cleared",
            message: `Question ${number} has been cleared and is no longer available for validation.`
          });
        } catch (e) {
          alert("Failed to clear question: " + e);
        } finally {
          setIsSubmitting(false);
        }
        return;
      } else {
        setValidationPopup({
          title: "Empty Question",
          message: "The question has no content to save. Please enter question text and at least 2 options."
        });
        return;
      }
    }

    // 2. Everything is NOT deleted -> verify minimum criteria
    if (!trimmedText && filledOptions.length < 2) {
      setValidationPopup({
        title: "Incomplete Question",
        message: "To move this question for validation, you must provide question text and a minimum of two options.\n\n(Tip: To remove a previously saved question from validation, clear all fields and click Save.)"
      });
      return;
    }

    if (!trimmedText) {
      setValidationPopup({
        title: "Question Text Required",
        message: "Question text is required before this question can be moved for validation."
      });
      return;
    }

    if (filledOptions.length < 2) {
      setValidationPopup({
        title: "Minimum Options Required",
        message: `A minimum of two options with text is required before this question can be moved for validation (currently ${filledOptions.length} provided).`
      });
      return;
    }

    const hasGap = options.some((opt, idx) => !opt.text.trim() && options.slice(idx + 1).some(next => next.text.trim().length > 0));
    if (hasGap) {
      setValidationPopup({
        title: "Empty Option Found",
        message: "An empty option was found before a filled option. Please fill in the empty option or remove it using the delete icon."
      });
      return;
    }

    const formattedOptions = filledOptions.map((opt, idx) => ({
      ...opt,
      letter: String.fromCharCode(65 + idx),
      text: opt.text.trim(),
    }));

    setIsSubmitting(true);
    try {
      await onSubmit({
        exam, subject, year, number,
        question_text: trimmedText,
        has_diagram: hasDiagram,
        options: formattedOptions
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
          <div key={opt.letter} className="flex items-center gap-2 sm:gap-3 mb-3">
            <span className="font-title-md w-6 shrink-0">{opt.letter}.</span>
            <input 
              type="text"
              readOnly={readOnly}
              className="flex-1 min-w-0 bg-surface border border-outline-variant rounded-lg p-2.5 sm:p-3 text-body-md focus:outline-none focus:border-primary transition-colors"
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
                className="w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-error-container hover:text-error transition-colors shrink-0"
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
        <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-primary text-on-primary rounded-xl font-title-md hover:brightness-110 flex items-center justify-center gap-2 min-h-[48px]"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save Question'}
          </button>
          {onCancel && (
            <button 
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-3 bg-surface-variant text-on-surface-variant rounded-xl font-title-md hover:brightness-95 flex items-center justify-center min-h-[48px]"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {validationPopup && (
        <AppModal
          isOpen={!!validationPopup}
          onClose={() => setValidationPopup(null)}
          title={validationPopup.title}
          maxWidth="sm"
          centerOnMobile
        >
          <div className="flex flex-col gap-5 pt-2">
            <p className="text-body-md text-on-surface-variant whitespace-pre-line leading-relaxed">
              {validationPopup.message}
            </p>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setValidationPopup(null)}
                className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-title-sm hover:brightness-110 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </AppModal>
      )}
    </div>
  );
};
