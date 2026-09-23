import React, { useState } from 'react';
import { Check, X, Lightbulb } from 'lucide-react';
import type { QuizCard as ApiQuizCard } from '../api';

interface Props {
  card: ApiQuizCard;
  answered: boolean;
  onRevealAnswer: (isCorrect: boolean) => void;
}

export const QuizCard: React.FC<Props> = ({ card, answered, onRevealAnswer }) => {
  const { question_type, payload } = card;

  // Render dispatch
  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline-sm text-headline-sm text-on-surface font-semibold leading-snug">
          {question_type === 'mcq' && payload.question}
          {question_type === 'true_false' && payload.stem}
          {question_type === 'applies' && payload.question}
          {question_type === 'fill_in' && "Fill in the blanks:"}
        </h1>
      </div>

      <div className="w-full">
        {question_type === 'mcq' && <MCQQuiz answered={answered} payload={payload} onReveal={onRevealAnswer} />}
        {question_type === 'true_false' && <TrueFalseQuiz answered={answered} payload={payload} onReveal={onRevealAnswer} />}
        {question_type === 'fill_in' && <FillInQuiz answered={answered} payload={payload} onReveal={onRevealAnswer} />}
        {question_type === 'applies' && <AppliesQuiz answered={answered} payload={payload} onReveal={onRevealAnswer} />}
      </div>

      {answered && payload.explanation && (
        <div className="flex flex-col gap-3 p-4 rounded-xl rounded-l-none bg-surface-container-low border-l-4 border-secondary shadow-lg mt-2 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 text-secondary font-title-sm text-title-sm">
            <Lightbulb size={20} />
            <span className="font-bold tracking-tight">Clinical Explanation & High-Yield Pearl</span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            {payload.explanation}
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Component: MCQ ────────────────────────────────────────────────────────

const MCQQuiz: React.FC<{ payload: any, answered: boolean, onReveal: (isCorrect: boolean) => void }> = ({ payload, answered, onReveal }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelectedIndex(idx);
    // Auto-reveal on select for MCQ (preserves fast Anki feel)
    const isCorrect = idx === payload.correct_index;
    onReveal(isCorrect);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
      {payload.options.map((opt: string, idx: number) => {
        const isSelected = selectedIndex === idx;
        const isCorrect = idx === payload.correct_index;

        let containerClass = "group flex items-start justify-between p-4 rounded-xl cursor-pointer select-none transition-all ";
        let letterClass = "flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-title-sm text-title-sm transition-colors ";
        let iconContent = null;
        let textClass = "font-body-md text-body-md leading-relaxed font-medium ";

        if (!answered) {
          containerClass += "bg-surface-container-high hover:bg-surface-bright text-on-surface";
          letterClass += "bg-surface-container-low text-outline group-hover:text-on-surface";
          textClass += "text-on-surface";
        } else {
          if (isCorrect) {
            containerClass += "bg-secondary-container/40 text-secondary shadow-[0_0_24px_rgba(124,77,255,0.22)] ring-1 ring-secondary/50";
            letterClass += "bg-secondary text-on-secondary font-bold";
            textClass += "text-primary font-semibold";
            iconContent = (
              <div className="w-6 h-6 rounded-full bg-secondary text-on-secondary flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                <Check size={16} strokeWidth={3} />
              </div>
            );
          } else if (isSelected) {
            containerClass += "bg-error-container/30 text-error ring-1 ring-error/50";
            letterClass += "bg-error text-on-error font-bold";
            textClass += "text-error font-semibold line-through opacity-80";
            iconContent = (
              <div className="w-6 h-6 rounded-full bg-error text-on-error flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                <X size={16} strokeWidth={3} />
              </div>
            );
          } else {
            containerClass += "bg-surface-container-high opacity-60 text-on-surface";
            letterClass += "bg-surface-container-low text-outline";
            textClass += "text-on-surface-variant";
          }
        }

        return (
          <div key={idx} onClick={() => handleSelect(idx)} className={containerClass}>
            <div className="flex items-start gap-3.5 min-w-0 flex-1">
              <span className={letterClass}>{letters[idx]}</span>
              <div className="flex flex-col">
                <span className={textClass}>{opt}</span>
                {answered && isCorrect && <span className="font-label-sm text-secondary font-bold uppercase tracking-wider mt-1">Correct Answer</span>}
                {answered && isSelected && !isCorrect && <span className="font-label-sm text-error font-bold uppercase tracking-wider mt-1">Your Answer</span>}
              </div>
            </div>
            {iconContent}
          </div>
        );
      })}
    </div>
  );
};

// ─── Component: True/False ─────────────────────────────────────────────────

const TrueFalseQuiz: React.FC<{ payload: any, answered: boolean, onReveal: (isCorrect: boolean) => void }> = ({ payload, answered, onReveal }) => {
  const [statements] = useState(() => 
    payload.statements.map((stmt: any) => {
      const isTrue = Math.random() > 0.5;
      return {
        text: isTrue ? stmt.true_statement : stmt.false_alternative,
        isTrue
      };
    })
  );

  const [answers, setAnswers] = useState<Record<number, boolean>>({});

  const toggleAnswer = (idx: number, val: boolean) => {
    if (answered) return;
    setAnswers(prev => ({ ...prev, [idx]: val }));
  };

  const allAnswered = Object.keys(answers).length === statements.length;

  return (
    <div className="flex flex-col gap-4">
      {statements.map((stmt: any, idx: number) => {
        const userAns = answers[idx];
        const isCorrect = userAns === stmt.isTrue;
        
        let rowClass = "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-colors ";
        if (!answered) {
          rowClass += "bg-surface-container-low border-outline-variant";
        } else {
          rowClass += isCorrect 
            ? "bg-secondary-container/20 border-secondary/40 text-on-surface" 
            : "bg-error-container/20 border-error/40 text-on-surface";
        }

        return (
          <div key={idx} className={rowClass}>
            <div className="flex flex-col flex-1">
              <span className={`font-body-md text-body-md leading-relaxed ${answered && !isCorrect && !stmt.isTrue ? 'line-through opacity-80' : ''}`}>{stmt.text}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggleAnswer(idx, true)}
                disabled={answered}
                className={`px-4 py-2 rounded-lg font-title-sm text-title-sm transition-all ${
                  userAns === true 
                    ? "bg-primary text-on-primary shadow-sm" 
                    : "bg-surface-container-high text-on-surface-variant hover:bg-surface-bright"
                } ${answered && stmt.isTrue ? "ring-2 ring-secondary ring-offset-2 ring-offset-surface" : ""}`}
              >
                True
              </button>
              <button
                onClick={() => toggleAnswer(idx, false)}
                disabled={answered}
                className={`px-4 py-2 rounded-lg font-title-sm text-title-sm transition-all ${
                  userAns === false 
                    ? "bg-primary text-on-primary shadow-sm" 
                    : "bg-surface-container-high text-on-surface-variant hover:bg-surface-bright"
                } ${answered && !stmt.isTrue ? "ring-2 ring-secondary ring-offset-2 ring-offset-surface" : ""}`}
              >
                False
              </button>
              
              {answered && (
                <div className="w-6 h-6 ml-2 flex items-center justify-center shrink-0">
                  {isCorrect ? <Check size={20} className="text-secondary" /> : <X size={20} className="text-error" />}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {!answered && (
        <button 
          onClick={() => {
            const isCorrect = statements.every((stmt: any, idx: number) => answers[idx] === stmt.isTrue);
            onReveal(isCorrect);
          }}
          disabled={!allAnswered}
          className="mt-2 w-full py-4 rounded-xl bg-primary-container text-on-primary-fixed font-title-md hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50"
        >
          Check Answers
        </button>
      )}
    </div>
  );
};

// ─── Component: Fill-In ────────────────────────────────────────────────────

const FillInQuiz: React.FC<{ payload: any, answered: boolean, onReveal: (isCorrect: boolean) => void }> = ({ payload, answered, onReveal }) => {
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const segments = payload.question_text.split(/(\{gap_\d+\})/g);

  const handleSelect = (gapIdx: number, bankIdx: number) => {
    if (answered) return;
    setAnswers(prev => ({ ...prev, [gapIdx]: bankIdx }));
  };

  const allAnswered = Object.keys(answers).length === payload.gap_count;

  return (
    <div className="flex flex-col gap-6">
      <div className="p-5 rounded-2xl bg-surface-container-low border border-surface-container-highest leading-[3rem] font-body-lg text-on-surface">
        {segments.map((seg: string, i: number) => {
          const match = seg.match(/\{gap_(\d+)\}/);
          if (match) {
            const gapIdx = parseInt(match[1], 10);
            const userBankIdx = answers[gapIdx];
            
            const selectedItem = userBankIdx !== undefined ? payload.answer_bank[userBankIdx] : null;
            const isGapCorrect = selectedItem?.correct_for_gaps?.includes(gapIdx);
            
            let selectClass = "mx-2 px-3 py-1.5 rounded-lg border appearance-none font-title-md bg-surface text-primary outline-none transition-colors align-middle ";
            if (!answered) {
              selectClass += "border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer hover:bg-surface-bright";
            } else {
              selectClass += isGapCorrect 
                ? "border-secondary bg-secondary-container/30 text-secondary pointer-events-none"
                : "border-error bg-error-container/30 text-error pointer-events-none";
            }

            return (
              <span key={i} className="inline-flex items-center whitespace-nowrap gap-2">
                <span className="relative inline-block">
                  <select 
                    className={selectClass} 
                    value={userBankIdx ?? ""} 
                    onChange={(e) => handleSelect(gapIdx, parseInt(e.target.value, 10))}
                    disabled={answered}
                  >
                    <option value="" disabled>Select...</option>
                    {payload.answer_bank.map((opt: any, bIdx: number) => (
                      <option key={bIdx} value={bIdx}>{opt.text}</option>
                    ))}
                  </select>
                  {answered && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center bg-surface shadow-sm ring-1 ring-surface-container-highest z-10">
                      {isGapCorrect 
                        ? <Check size={12} className="text-secondary" strokeWidth={4} /> 
                        : <X size={12} className="text-error" strokeWidth={4} />}
                    </div>
                  )}
                </span>
                {answered && !isGapCorrect && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-error-container/20 text-error font-title-sm font-bold border border-error/40 align-middle">
                    {payload.answer_bank.filter((o: any) => o.correct_for_gaps?.includes(gapIdx)).map((o: any) => o.text).join(" / ")}
                  </span>
                )}
              </span>
            );
          }
          return <span key={i}>{seg}</span>;
        })}
      </div>

      {!answered && (
        <button 
          onClick={() => {
            const isCorrect = Object.keys(answers).length === payload.gap_count && 
              Object.entries(answers).every(([gapIdxStr, userBankIdx]) => {
                const gapIdx = parseInt(gapIdxStr, 10);
                return payload.answer_bank[userBankIdx]?.correct_for_gaps?.includes(gapIdx);
              });
            onReveal(isCorrect);
          }}
          disabled={!allAnswered}
          className="w-full py-4 rounded-xl bg-primary-container text-on-primary-fixed font-title-md hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50"
        >
          Check Answers
        </button>
      )}

      {answered && (
        <div className="p-4 rounded-xl border border-outline-variant bg-surface-container-lowest">
          <span className="font-title-sm text-title-sm text-on-surface-variant block mb-2">Correct Answers:</span>
          <ul className="list-disc pl-5 font-body-md text-on-surface space-y-1">
            {Array.from({ length: payload.gap_count }).map((_, gapIdx) => {
              const correctOpts = payload.answer_bank.filter((o: any) => o.correct_for_gaps?.includes(gapIdx)).map((o: any) => o.text);
              return (
                <li key={gapIdx}>
                  <span className="font-semibold text-secondary">Gap {gapIdx + 1}:</span> {correctOpts.join(" OR ")}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

// ─── Component: Select All That Apply ──────────────────────────────────────

const AppliesQuiz: React.FC<{ payload: any, answered: boolean, onReveal: (isCorrect: boolean) => void }> = ({ payload, answered, onReveal }) => {
  const [options] = useState(() => {
    const merged = [
      ...payload.correct_options.map((o: string) => ({ text: o, isCorrect: true })),
      ...payload.wrong_options.map((o: string) => ({ text: o, isCorrect: false }))
    ];
    return merged.sort(() => Math.random() - 0.5);
  });

  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggleOption = (idx: number) => {
    if (answered) return;
    const next = new Set(selected);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelected(next);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="font-label-sm text-on-surface-variant mb-2 bg-surface-container-high px-3 py-1 rounded-md w-fit">
        Select all options that apply
      </div>
      
      <div className="flex flex-col gap-3">
        {options.map((opt: any, idx: number) => {
          const isSelected = selected.has(idx);
          
          let containerClass = "flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer select-none ";
          let boxClass = "w-6 h-6 rounded border-2 flex items-center justify-center transition-colors shrink-0 ";
          
          if (!answered) {
            containerClass += isSelected 
              ? "bg-primary-container/20 border-primary shadow-sm" 
              : "bg-surface-container-low border-outline-variant hover:border-outline";
            boxClass += isSelected 
              ? "bg-primary border-primary text-on-primary" 
              : "border-outline";
          } else {
            // Answered state
            if (opt.isCorrect) {
              containerClass += "bg-secondary-container/20 border-secondary/50 ring-1 ring-secondary/30";
              boxClass += "bg-secondary border-secondary text-on-secondary";
            } else if (isSelected && !opt.isCorrect) {
              containerClass += "bg-error-container/20 border-error/50 ring-1 ring-error/30";
              boxClass += "bg-error border-error text-on-error";
            } else {
              containerClass += "bg-surface-container-low border-surface-container-highest opacity-50";
              boxClass += "border-outline-variant bg-surface-container-highest";
            }
          }

          return (
            <div key={idx} onClick={() => toggleOption(idx)} className={containerClass}>
              <div className={boxClass}>
                {isSelected && <Check size={16} strokeWidth={3} />}
                {answered && !isSelected && opt.isCorrect && <Check size={16} strokeWidth={3} className="opacity-50" />}
              </div>
              <div className="flex flex-col flex-1">
                <span className={`font-body-md ${answered && opt.isCorrect ? "text-on-surface font-semibold" : (answered && isSelected && !opt.isCorrect ? "text-error font-semibold line-through opacity-80" : "text-on-surface-variant")}`}>
                  {opt.text}
                </span>
                {answered && isSelected && !opt.isCorrect && (
                  <span className="font-label-sm text-error font-bold uppercase tracking-wider mt-1">Incorrect Selection</span>
                )}
                {answered && !isSelected && opt.isCorrect && (
                  <span className="font-label-sm text-secondary font-bold uppercase tracking-wider mt-1">Missed Correct Answer</span>
                )}
              </div>
              {answered && isSelected && !opt.isCorrect && (
                <X size={18} className="text-error shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {!answered && (
        <button 
          onClick={() => {
            const isCorrect = options.every((opt: any, idx: number) => {
              if (opt.isCorrect && !selected.has(idx)) return false;
              if (!opt.isCorrect && selected.has(idx)) return false;
              return true;
            });
            onReveal(isCorrect);
          }}
          disabled={selected.size === 0}
          className="mt-2 w-full py-4 rounded-xl bg-primary-container text-on-primary-fixed font-title-md hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50"
        >
          Check Answers
        </button>
      )}
    </div>
  );
};
