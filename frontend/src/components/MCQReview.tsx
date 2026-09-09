import React, { useState } from 'react';
import type { Question, MCQPayload } from '../store/useStore';

interface Props {
  question: Question;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
  isLastQuestion?: boolean;
}

export const MCQReview: React.FC<Props> = ({ question, onAnswer, onNext, isLastQuestion = false }) => {
  const payload = question.payload as MCQPayload;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  const handleCheck = () => {
    if (selectedIndex === null) return;
    setChecked(true);
    onAnswer(selectedIndex === payload.correct_index);
  };

  const getOptionClass = (index: number) => {
    if (!checked) {
      return selectedIndex === index
        ? 'ring-2 ring-green-500 bg-surface-container'
        : 'hover:bg-surface-container-high';
    }
    if (index === payload.correct_index) {
      return 'bg-green-100 border-green-500 dark:bg-green-900/30';
    }
    if (index === selectedIndex) {
      return 'bg-red-100 border-red-500 dark:bg-red-900/30';
    }
    return '';
  };

  return (
    <div className="flex flex-col gap-md">
      <div className="font-body-lg text-on-surface mb-sm">{payload.question}</div>
      <div className="flex flex-col gap-sm">
        {payload.options.map((opt, i) => (
          <div 
            key={i}
            onClick={() => !checked && setSelectedIndex(i)}
            className={`p-md rounded-lg border border-outline-variant cursor-pointer transition-all break-words ${getOptionClass(i)}`}
          >
            {opt}
          </div>
        ))}
      </div>
      
      {checked && (
        <div className="mt-md p-md bg-surface-container-low rounded-lg text-body-md text-on-surface">
          <strong>Explanation:</strong> {payload.explanation}
        </div>
      )}

      <div className="mt-xl flex justify-end">
        {!checked ? (
          <button 
            onClick={handleCheck}
            disabled={selectedIndex === null}
            className="px-xl py-sm bg-primary text-on-primary rounded-full disabled:opacity-50 font-label-lg"
          >
            Check Answer
          </button>
        ) : (
          <button 
            onClick={onNext}
            className="px-xl py-sm bg-primary text-on-primary rounded-full font-label-lg"
          >
            {isLastQuestion ? 'End Review' : 'Next Question'}
          </button>
        )}
      </div>
    </div>
  );
};
