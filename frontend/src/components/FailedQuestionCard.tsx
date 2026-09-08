import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import type { Question } from '../store/useStore';
import { triggerGeneration } from '../hooks/useQuestionGeneration';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

export const FailedQuestionCard: React.FC<{ question: Question }> = ({ question }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const removeQuestion = useStore(state => state.removeQuestion);

  const handleRetry = async () => {
    if (!question.generationPayload) return;
    setIsRetrying(true);
    const { blockId, selectedText, type, materialId } = question.generationPayload;
    removeQuestion(question.id);
    await triggerGeneration(blockId, selectedText, type as any, materialId);
    setIsRetrying(false);
  };

  return (
    <div className="bg-error-container/20 border border-error/30 rounded-xl p-md shadow-sm shrink-0">
      <div className="flex items-start justify-between gap-sm mb-sm">
        <div className="flex items-center gap-xs text-error text-label-sm font-medium">
          <AlertCircle size={14} />
          Generation Failed
          <span className="text-on-surface-variant font-normal ml-xs text-label-xs capitalize">
            ({question.type?.replace('_', ' ')})
          </span>
        </div>
        <button onClick={() => removeQuestion(question.id)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-error/10 text-error" title="Dismiss">
          <X size={14} />
        </button>
      </div>

      <button onClick={() => setShowDetails(v => !v)} className="text-label-xs text-on-surface-variant underline underline-offset-2 mb-sm">
        {showDetails ? 'Hide reason' : 'Show reason'}
      </button>

      {showDetails && (
        <div className="bg-surface rounded p-sm text-label-xs text-error font-mono mb-sm overflow-auto max-h-32 whitespace-pre-wrap">
          {question.error}
        </div>
      )}

      {question.generationPayload && (
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="w-full flex items-center justify-center gap-xs bg-error text-on-error py-xs rounded text-label-sm disabled:opacity-50"
        >
          <RefreshCw size={13} className={isRetrying ? 'animate-spin' : ''} />
          {isRetrying ? 'Retrying...' : 'Retry'}
        </button>
      )}
    </div>
  );
};
