import React from 'react';
import { useStore } from '../store/useStore';
import type { Question } from '../store/useStore';
import { Check, X, CheckSquare, Radio, Space as SpaceIcon } from 'lucide-react';
import clsx from 'clsx';

const TrueFalseCard: React.FC<{ question: Question }> = ({ question }) => {
  const { updateQuestionStatus, removeQuestion } = useStore();
  const { id, payload } = question;

  return (
    <div className="bg-surface-container rounded-xl p-md shadow-lg transition-all group border border-primary relative overflow-hidden transform hover:scale-[1.02]">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
      
      <div className="flex justify-between items-start mb-md relative z-10">
        <div className="flex items-center gap-xs bg-primary-container text-on-primary-container px-sm py-xs rounded text-label-sm shadow-sm">
          <CheckSquare size={14} /> True / False Cluster
        </div>
        <div className="flex gap-xs">
          <button 
            onClick={() => { updateQuestionStatus(id, 'rejected'); setTimeout(() => removeQuestion(id), 300); }}
            className="w-8 h-8 rounded-full bg-surface-container-highest hover:bg-error-container text-on-surface-variant hover:text-on-error-container flex items-center justify-center transition-colors shadow-sm"
          >
            <X size={18} />
          </button>
          <button 
            onClick={() => { updateQuestionStatus(id, 'approved'); setTimeout(() => removeQuestion(id), 300); }}
            className="w-8 h-8 rounded-full bg-surface-container-highest hover:bg-primary text-on-surface-variant hover:text-on-primary flex items-center justify-center transition-colors shadow-sm"
          >
            <Check size={18} />
          </button>
        </div>
      </div>
      
      <p className="font-body-md text-on-surface mb-md relative z-10">{payload.prompt}</p>
      
      <div className="space-y-xs relative z-10">
        {payload.statements?.map((statement: any, i: number) => (
          <div key={i} className="flex items-center justify-between p-sm bg-surface rounded-lg shadow-sm">
            <span className="text-body-md text-on-surface max-w-[70%]">{statement.text}</span>
            <div className="flex bg-surface-container-highest rounded-full p-1 shadow-inner">
              <button className={clsx("px-3 py-1 rounded-full text-label-sm shadow-sm", statement.answer ? "bg-surface-container text-on-surface" : "text-on-surface-variant")}>T</button>
              <button className={clsx("px-3 py-1 rounded-full text-label-sm shadow-sm", !statement.answer ? "bg-surface-container text-on-surface" : "text-on-surface-variant")}>F</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MultipleChoiceCard: React.FC<{ question: Question }> = ({ question }) => {
  const { updateQuestionStatus, removeQuestion } = useStore();
  const { id, payload } = question;

  return (
    <div className="bg-surface-container rounded-xl p-md shadow-md hover:shadow-lg transition-all group border border-transparent hover:border-surface-variant relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="flex justify-between items-start mb-md">
        <div className="flex items-center gap-xs bg-secondary-container/30 text-on-secondary-container px-sm py-xs rounded text-label-sm">
          <Radio size={14} /> MCQ
        </div>
        <div className="flex gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => { updateQuestionStatus(id, 'rejected'); setTimeout(() => removeQuestion(id), 300); }}
            className="w-8 h-8 rounded-full bg-surface-container-highest hover:bg-error-container text-on-surface-variant hover:text-on-error-container flex items-center justify-center transition-colors shadow-sm"
          >
            <X size={18} />
          </button>
          <button 
            onClick={() => { updateQuestionStatus(id, 'approved'); setTimeout(() => removeQuestion(id), 300); }}
            className="w-8 h-8 rounded-full bg-surface-container-highest hover:bg-primary text-on-surface-variant hover:text-on-primary flex items-center justify-center transition-colors shadow-sm"
          >
            <Check size={18} />
          </button>
        </div>
      </div>
      
      <p className="font-body-md text-on-surface mb-md">{payload.question}</p>
      
      <div className="space-y-sm">
        {payload.options?.map((option: string, i: number) => {
            const isSelected = i === payload.answerIndex;
            return (
              <label key={i} className={clsx(
                "flex items-center gap-md p-sm rounded-lg cursor-pointer transition-colors shadow-sm border",
                isSelected 
                  ? "bg-primary-container/20 border-primary/30" 
                  : "bg-surface hover:bg-surface-container-highest border-transparent"
              )}>
                <input type="radio" name={`q-${id}`} className="hidden peer" defaultChecked={isSelected} />
                <div className={clsx(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                  isSelected ? "border-primary bg-primary" : "border-outline peer-checked:border-primary peer-checked:bg-primary"
                )}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-on-primary"></div>}
                </div>
                <span className={clsx(
                  "text-body-md",
                  isSelected ? "text-on-primary-container font-medium" : "text-on-surface-variant peer-checked:text-on-surface"
                )}>{option}</span>
              </label>
            );
        })}
      </div>
    </div>
  );
};

const FillInTheGapCard: React.FC<{ question: Question }> = ({ question }) => {
  const { updateQuestionStatus, removeQuestion } = useStore();
  const { id, payload } = question;

  // Parse text and replace {{gap_X}} with blank spans
  const parts = payload.text?.split(/(\{\{gap_\d+\}\})/g) || [];

  return (
    <div className="bg-surface-container rounded-xl p-md shadow-md hover:shadow-lg transition-all group border border-transparent hover:border-surface-variant relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-tertiary opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="flex justify-between items-start mb-md">
        <div className="flex items-center gap-xs bg-tertiary-container/30 text-tertiary-fixed px-sm py-xs rounded text-label-sm">
          <SpaceIcon size={14} /> Fill-in
        </div>
        <div className="flex gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => { updateQuestionStatus(id, 'rejected'); setTimeout(() => removeQuestion(id), 300); }}
            className="w-8 h-8 rounded-full bg-surface-container-highest hover:bg-error-container text-on-surface-variant hover:text-on-error-container flex items-center justify-center transition-colors shadow-sm"
          >
            <X size={18} />
          </button>
          <button 
            onClick={() => { updateQuestionStatus(id, 'approved'); setTimeout(() => removeQuestion(id), 300); }}
            className="w-8 h-8 rounded-full bg-surface-container-highest hover:bg-primary text-on-surface-variant hover:text-on-primary flex items-center justify-center transition-colors shadow-sm"
          >
            <Check size={18} />
          </button>
        </div>
      </div>
      
      <div className="font-body-md text-on-surface mb-lg leading-loose bg-surface p-md rounded-lg shadow-inner">
        {parts.map((part: string, index: number) => {
          if (part.startsWith('{{') && part.endsWith('}}')) {
            return <span key={index} className="inline-block w-24 h-8 bg-surface-container-highest border-b-2 border-outline-variant mx-sm align-middle rounded-t"></span>;
          }
          return <React.Fragment key={index}>{part}</React.Fragment>;
        })}
      </div>
      
      <div>
        <div className="text-label-sm text-on-surface-variant mb-sm uppercase tracking-wider">Word Bank</div>
        <div className="flex flex-wrap gap-sm">
          {payload.options?.map((word: string, i: number) => (
            <div key={i} className="px-md py-sm bg-surface rounded-lg text-body-md text-on-surface cursor-grab active:cursor-grabbing shadow-sm border border-outline-variant hover:border-primary hover:text-primary transition-colors flex items-center gap-xs">
              {word}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const QuestionRenderer: React.FC<{ question: Question }> = ({ question }) => {
  if (question.status !== 'pending') return null;

  switch (question.type) {
    case 'true_false':
      return <TrueFalseCard question={question} />;
    case 'mcq':
      return <MultipleChoiceCard question={question} />;
    case 'fill_in':
      return <FillInTheGapCard question={question} />;
    default:
      return null;
  }
};
