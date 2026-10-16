import React from 'react';
import type { PastQuestion } from '../../api';
import { Trash2 } from 'lucide-react';

interface QuestionViewerProps {
  question: PastQuestion;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const QuestionViewer: React.FC<QuestionViewerProps> = ({ question, onEdit, onDelete }) => {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display-sm mb-1 sm:mb-2 break-words">{question.exam_name} {question.year} - {question.subject_name}</h2>
          <h3 className="font-title-lg text-primary">Question {question.number}</h3>
        </div>
        {(onEdit || onDelete) && (
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
            {onEdit && (
              <button 
                onClick={onEdit}
                className="px-4 py-2 border border-outline-variant hover:bg-surface-variant rounded-lg font-title-sm transition-colors"
              >
                Edit Question
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="px-4 py-2 bg-error/10 text-error border border-error/30 hover:bg-error hover:text-on-error rounded-lg font-title-sm transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={16} />
                <span>Delete Question</span>
              </button>
            )}
          </div>
        )}
      </div>
      
      <div className="p-4 sm:p-6 bg-surface border border-outline-variant rounded-2xl shadow-sm text-base sm:text-lg whitespace-pre-wrap break-words">
        {question.question_text}
      </div>

      {question.has_diagram && (
        <div className="text-primary font-title-sm flex items-center gap-2">
          <span className="w-2 h-2 bg-primary rounded-full shrink-0"></span>
          This question has an image / diagram
        </div>
      )}

      <div className="flex flex-col gap-3">
        {question.options.map(opt => (
          <div key={opt.letter} className={`p-3 sm:p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${opt.is_correct ? 'bg-secondary-container/30 border-secondary' : 'bg-surface border-outline-variant'}`}>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${opt.is_correct ? 'bg-secondary text-on-secondary' : 'bg-surface-variant text-on-surface-variant'}`}>
                {opt.letter}
              </div>
              <span className="font-body-lg flex-1 break-words">{opt.text}</span>
            </div>
            {opt.is_correct && <span className="text-secondary font-bold text-xs sm:text-sm uppercase tracking-wider shrink-0 self-end sm:self-auto">Correct Answer</span>}
          </div>
        ))}
      </div>
    </>
  );
};
