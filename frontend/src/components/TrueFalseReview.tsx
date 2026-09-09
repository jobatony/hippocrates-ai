import React, { useState, useEffect } from 'react';
import type { Question, TrueFalsePayload, TrueFalseStatementPayload } from '../store/useStore';

interface Props {
  question: Question;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
  isLastQuestion?: boolean;
}

// We map statements to either their True or False version randomly on mount
interface ShownStatement {
  original: TrueFalseStatementPayload;
  text: string;
  isTrue: boolean;
}

export const TrueFalseReview: React.FC<Props> = ({ question, onAnswer, onNext, isLastQuestion = false }) => {
  const payload = question.payload as TrueFalsePayload;
  
  const [shown, setShown] = useState<ShownStatement[]>([]);
  const [selections, setSelections] = useState<Record<number, 'true' | 'false' | null>>({});
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Reset state when question changes
    setChecked(false);
    setSelections({});
    
    // Pick 4 random statements from all available
    const shuffled = [...payload.statements].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, 4);
    
    // For each, randomly decide whether to show the true or false statement
    const display = picked.map(stmt => {
      const showTrue = Math.random() > 0.5;
      return {
        original: stmt,
        text: showTrue ? stmt.true_statement : stmt.false_alternative,
        isTrue: showTrue
      };
    });
    setShown(display);
  }, [question]);

  const allSelected = shown.length > 0 && shown.every((_, i) => selections[i] !== undefined && selections[i] !== null);

  const handleCheck = () => {
    if (!allSelected) return;
    setChecked(true);
    
    const allCorrect = shown.every((stmt, i) => {
      const answer = selections[i] === 'true';
      return answer === stmt.isTrue;
    });
    
    onAnswer(allCorrect);
  };

  return (
    <div className="flex flex-col gap-md">
      <div className="font-body-lg text-on-surface mb-md">{payload.stem}</div>
      <div className="flex flex-col gap-sm">
        {shown.map((stmt, i) => {
          const selectedTrue = selections[i] === 'true';
          const selectedFalse = selections[i] === 'false';
          const userWasCorrect = (selectedTrue && stmt.isTrue) || (selectedFalse && !stmt.isTrue);
          
          let containerClass = "border-outline-variant";
          let trueCircleClass = "border-outline-variant text-on-surface-variant";
          let falseCircleClass = "border-outline-variant text-on-surface-variant";

          if (!checked) {
            if (selectedTrue) trueCircleClass = "border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20";
            if (selectedFalse) falseCircleClass = "border-red-500 text-red-600 bg-red-50 dark:bg-red-900/20";
          } else {
            // Checked State
            containerClass = userWasCorrect ? "border-green-500 bg-green-50 dark:bg-green-900/10" : "border-red-500 bg-red-50 dark:bg-red-900/10";
            
            if (stmt.isTrue) {
              trueCircleClass = "bg-green-500 border-green-500 text-white";
              if (selectedFalse) falseCircleClass = "border-red-500 text-red-600";
            } else {
              falseCircleClass = "bg-red-500 border-red-500 text-white";
              if (selectedTrue) trueCircleClass = "border-green-500 text-green-600";
            }
          }

          return (
            <div key={i} className={`flex flex-col gap-xs p-md rounded-lg border transition-all ${containerClass}`}>
              <div className="flex items-center gap-md">
                <div className="flex items-center gap-xs shrink-0">
                  <button 
                    onClick={() => !checked && setSelections(prev => ({ ...prev, [i]: 'true' }))}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold transition-all ${trueCircleClass}`}
                  >T</button>
                  <button 
                    onClick={() => !checked && setSelections(prev => ({ ...prev, [i]: 'false' }))}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold transition-all ${falseCircleClass}`}
                  >F</button>
                </div>
                <span className="text-body-md text-on-surface">{stmt.text}</span>
              </div>
              {checked && !userWasCorrect && (
                <div className="ml-[72px] mt-xs pl-md border-l-2 border-error/40 text-label-sm text-error dark:text-red-300">
                  {!stmt.isTrue ? (
                    <><span className="font-bold opacity-80">Correct fact:</span> {stmt.original.true_statement}</>
                  ) : (
                    <><span className="font-bold opacity-80">Actually, this statement is true.</span></>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-xl flex justify-end">
        {!checked ? (
          <button 
            onClick={handleCheck}
            disabled={!allSelected}
            className="px-xl py-sm bg-primary text-on-primary rounded-full disabled:opacity-50 font-label-lg"
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


