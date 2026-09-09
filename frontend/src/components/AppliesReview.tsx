import React, { useState } from 'react';
import type { Question } from '../store/useStore';

interface AppliesPayload {
  question: string;
  correct_options: string[];
  wrong_options: string[];
}

interface Props {
  question: Question;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
  isLastQuestion?: boolean;
}

export const AppliesReview: React.FC<Props> = ({ question, onAnswer, onNext, isLastQuestion = false }) => {
  const payload = question.payload as AppliesPayload;
  const [shuffledOptions] = useState(() => {
    const all = [...payload.correct_options, ...payload.wrong_options];
    return all.sort(() => Math.random() - 0.5);
  });
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [checked, setChecked] = useState(false);

  const toggleSelection = (index: number) => {
    if (checked) return;
    const nextSet = new Set(selectedIndices);
    if (nextSet.has(index)) nextSet.delete(index);
    else nextSet.add(index);
    setSelectedIndices(nextSet);
  };

  const handleCheck = () => {
    setChecked(true);
    let allCorrectSelected = true;
    let noWrongSelected = true;

    for (const opt of payload.correct_options) {
      const idx = shuffledOptions.indexOf(opt);
      if (!selectedIndices.has(idx)) allCorrectSelected = false;
    }

    for (const opt of payload.wrong_options) {
      const idx = shuffledOptions.indexOf(opt);
      if (selectedIndices.has(idx)) noWrongSelected = false;
    }

    onAnswer(allCorrectSelected && noWrongSelected);
  };

  const getOptionClass = (index: number) => {
    const isSelected = selectedIndices.has(index);
    const optText = shuffledOptions[index];
    const isActuallyCorrect = payload.correct_options.includes(optText);

    if (!checked) {
      return isSelected
        ? 'ring-2 ring-primary bg-surface-container'
        : 'hover:bg-surface-container-high';
    }

    if (isActuallyCorrect) {
      return 'bg-green-100 border-green-500 dark:bg-green-900/30';
    }
    if (isSelected && !isActuallyCorrect) {
      return 'bg-red-100 border-red-500 dark:bg-red-900/30';
    }
    return '';
  };

  return (
    <div className="flex flex-col gap-md">
      <div className="font-body-lg text-on-surface mb-sm">{payload.question}</div>
      <div className="flex flex-col gap-sm">
        {shuffledOptions.map((opt, i) => (
          <div 
            key={i}
            onClick={() => toggleSelection(i)}
            className={`p-md rounded-lg border border-outline-variant cursor-pointer transition-all flex items-center gap-sm ${getOptionClass(i)}`}
          >
            <input 
              type="checkbox" 
              checked={selectedIndices.has(i)} 
              readOnly 
              className="pointer-events-none shrink-0" 
            />
            <span className="flex-1 min-w-0 break-words">{opt}</span>
          </div>
        ))}
      </div>

      <div className="mt-xl flex justify-end">
        {!checked ? (
          <button 
            onClick={handleCheck}
            className="px-xl py-sm bg-primary text-on-primary rounded-full font-label-lg"
          >
            Check Answer
          </button>
        ) : (
          <button 
            onClick={onNext}
            className="px-xl py-sm bg-primary text-on-primary rounded-full font-label-lg"
          >{isLastQuestion ? 'End Review' : 'Next Question'}</button>
        )}
      </div>
    </div>
  );
};


