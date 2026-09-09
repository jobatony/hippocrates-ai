import React, { useState, useEffect } from 'react';
import type { Question, FillInPayload } from '../store/useStore';

interface Props {
  question: Question;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
  isLastQuestion?: boolean;
}

export const FillInReview: React.FC<Props> = ({ question, onAnswer, onNext, isLastQuestion = false }) => {
  const payload = question.payload as FillInPayload;
  
  const [bank, setBank] = useState<string[]>([]);
  const [gaps, setGaps] = useState<Record<number, string | null>>({});
  const [checked, setChecked] = useState(false);
  const [gapResults, setGapResults] = useState<Record<number, 'correct' | 'wrong' | null>>({});

  useEffect(() => {
    const allOptions = payload.answer_bank.map(opt => opt.text);
    // Shuffle the bank
    setBank(allOptions.sort(() => 0.5 - Math.random()));
    setGaps({});
    setChecked(false);
    setGapResults({});
  }, [question]);

  const handleDragStart = (e: React.DragEvent, text: string) => {
    if (checked) return;
    e.dataTransfer.setData('text/plain', text);
  };

  const handleDrop = (e: React.DragEvent, gapIndex: number) => {
    e.preventDefault();
    if (checked) return;
    const text = e.dataTransfer.getData('text/plain');
    if (!text) return;
    
    setGaps(prev => {
      const newGaps = { ...prev };
      // If there was something already in this gap, put it back in the bank
      const existing = newGaps[gapIndex];
      if (existing) {
        setBank(b => [...b, existing]);
      }
      newGaps[gapIndex] = text;
      return newGaps;
    });
    
    // Remove from bank
    setBank(b => b.filter(item => item !== text));
  };

  const handleRemoveFromGap = (gapIndex: number) => {
    if (checked) return;
    const text = gaps[gapIndex];
    if (text) {
      setBank(b => [...b, text]);
      setGaps(prev => ({ ...prev, [gapIndex]: null }));
    }
  };

  const handleCheck = () => {
    setChecked(true);
    let allCorrect = true;
    const results: Record<number, 'correct' | 'wrong'> = {};
    
    for (let i = 0; i < payload.gap_count; i++) {
      const correctOpt = payload.answer_bank.find(opt => opt.correct_for_gaps.includes(i));
      const userText = gaps[i];
      
      if (correctOpt && userText === correctOpt.text) {
        results[i] = 'correct';
      } else {
        results[i] = 'wrong';
        allCorrect = false;
      }
    }
    
    setGapResults(results);
    onAnswer(allCorrect);
  };

  // Render question text with gap dropzones
  const parts = payload.question_text.split(/({gap_\d+})/g);
  const allGapsFilled = Object.keys(gaps).length === payload.gap_count && Object.values(gaps).every(v => v !== null);

  return (
    <div className="flex flex-col gap-md">
      <div className="bg-surface p-md rounded-lg border border-outline-variant leading-relaxed text-body-lg">
        {parts.map((part, index) => {
          const match = part.match(/{gap_(\d+)}/);
          if (match) {
            const gapIndex = parseInt(match[1]);
            const text = gaps[gapIndex];
            const result = gapResults[gapIndex];
            
            let gapContent = <>{text || (checked ? "" : "Drop here")}</>;
            let gapClass = "inline-flex items-center justify-center min-w-[120px] h-8 mx-xs border-b-2 bg-surface-container-low transition-colors align-middle px-sm";
            
            if (!checked) {
              gapClass += text ? " border-primary text-primary cursor-pointer" : " border-outline-variant border-dashed text-on-surface-variant hover:bg-surface-container cursor-pointer";
            } else {
              gapClass += " cursor-default rounded border-2";
              if (result === 'correct') {
                gapClass += " border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20";
              } else if (result === 'wrong') {
                // Show inline correction
                const correctOpt = payload.answer_bank.find(opt => opt.correct_for_gaps.includes(gapIndex));
                const correctText = correctOpt ? correctOpt.text : '???';
                
                // Override standard styles for inline correction container
                gapClass = "inline-flex items-center justify-center mx-xs bg-surface-container-low cursor-default align-middle overflow-hidden rounded border border-red-300 dark:border-red-800";
                
                gapContent = (
                  <div className="flex items-stretch h-8">
                    <span className="flex items-center px-sm bg-red-50 text-red-700 dark:bg-red-900/20 line-through text-sm border-r border-red-200 dark:border-red-800">
                      {text || "(Empty)"}
                    </span>
                    <span className="flex items-center px-sm bg-green-50 text-green-700 dark:bg-green-900/20 text-sm border-l border-green-200 dark:border-green-800">
                      {correctText}
                    </span>
                  </div>
                );
              }
            }

            return (
              <span
                key={index}
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, gapIndex)}
                onClick={() => handleRemoveFromGap(gapIndex)}
                className={gapClass}
              >
                {gapContent}
              </span>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </div>

      <div className="mt-md">
        <h3 className="text-label-md text-on-surface-variant mb-sm uppercase">Answer Bank</h3>
        <div className="flex flex-wrap gap-sm p-md bg-surface-container-lowest border border-outline-variant rounded-lg min-h-[80px]">
          {bank.map((text, i) => {
            let badgeClass = "px-md py-xs rounded border shadow-sm text-body-md transition-colors max-w-full break-words whitespace-normal ";
            
            if (!checked) {
              badgeClass += "bg-surface border-outline cursor-grab active:cursor-grabbing text-on-surface hover:bg-surface-container-high";
            } else {
              // Checked state: all options neutral, no highlighting, just read-only
              badgeClass += "cursor-default bg-surface border-outline-variant text-on-surface-variant opacity-70";
            }
            
            return (
              <div 
                key={`${i}-${text}`}
                draggable={!checked}
                onDragStart={(e) => handleDragStart(e, text)}
                className={badgeClass}
              >
                {text}
              </div>
            );
          })}
          {bank.length === 0 && <span className="text-on-surface-variant opacity-50 italic text-body-sm my-auto">Empty</span>}
        </div>
      </div>

      <div className="mt-xl flex justify-end">
        {!checked ? (
          <button 
            onClick={handleCheck}
            disabled={!allGapsFilled}
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


