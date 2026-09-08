import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import type { Question } from '../store/useStore';
import { approveQuestion, deleteQuestion, regenerateQuestion, updateQuestionPayload } from '../api';
import { Check, X, CheckSquare, Radio, Space as SpaceIcon, Edit2, RefreshCw, Save, ListChecks } from 'lucide-react';
import clsx from 'clsx';

import { MCQRenderer } from './MCQRenderer';
import { TrueFalseRenderer } from './TrueFalseRenderer';
import { FillInRenderer } from './FillInRenderer';
import { AppliesRenderer } from './AppliesRenderer';
import { FailedQuestionCard } from './FailedQuestionCard';

interface Props {
  question: Question;
}

export const QuestionCard: React.FC<Props> = ({ question }) => {
  const { id, type, payload } = question;
  const { updateQuestionStatus, removeQuestion, updateQuestionPayload: syncStore, setLastPromptSent } = useStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedPayload, setEditedPayload] = useState(payload);
  
  const [isReprompting, setIsReprompting] = useState(false);
  const [repromptInstruction, setRepromptInstruction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false); // Used for loading states

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await approveQuestion(id);
      updateQuestionStatus(id, 'approved');
      setTimeout(() => removeQuestion(id), 300);
    } catch (e) {
      alert("Failed to approve");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      await deleteQuestion(id);
      removeQuestion(id);
    } catch (e) {
      alert("Failed to delete");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveEdit = async () => {
    setIsProcessing(true);
    try {
      await updateQuestionPayload(id, editedPayload);
      syncStore(id, editedPayload);
      setIsEditing(false);
    } catch (e) {
      alert("Failed to save edit");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReprompt = async () => {
    if (!repromptInstruction.trim()) return;
    setIsProcessing(true);
    try {
      const updated = await regenerateQuestion(id, repromptInstruction);
      syncStore(id, updated.payload);
      setEditedPayload(updated.payload);
      setIsReprompting(false);
      setRepromptInstruction('');
      if (updated.prompt_sent) setLastPromptSent(updated.prompt_sent);
    } catch (e) {
      alert("Failed to regenerate");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderBadge = () => {
    if (type === 'true_false') return <><CheckSquare size={14} /> True / False</>;
    if (type === 'mcq') return <><Radio size={14} /> Multiple Choice</>;
    if (type === 'fill_in') return <><SpaceIcon size={14} /> Fill-in Gap</>;
    if (type === 'applies') return <><ListChecks size={14} /> Select All That Apply</>;
    return null;
  };

  if (question.status === 'failed') {
    return <FailedQuestionCard question={question} />;
  }

  return (
    <div className={clsx(
      "bg-surface-container rounded-xl p-md shadow-lg transition-all border relative overflow-hidden shrink-0",
      isEditing ? "border-primary" : "border-surface-variant hover:border-outline"
    )}>
      {/* Header */}
      <div className="flex justify-between items-start mb-md">
        <div className="flex items-center gap-xs bg-surface-container-high text-on-surface px-sm py-xs rounded text-label-sm shadow-sm">
          {renderBadge()}
        </div>
        
        <div className="flex gap-xs">
          {isEditing ? (
            <>
              <button 
                onClick={() => { setIsEditing(false); setEditedPayload(payload); }}
                className="w-8 h-8 rounded bg-surface-container-highest hover:bg-surface-variant flex items-center justify-center transition-colors"
                title="Cancel Edit"
              >
                <X size={16} />
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={isProcessing}
                className="w-8 h-8 rounded bg-primary text-on-primary flex items-center justify-center transition-colors disabled:opacity-50"
                title="Save Edit"
              >
                <Save size={16} />
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setIsReprompting(!isReprompting)}
                className="w-8 h-8 rounded-full bg-surface-container-highest hover:bg-secondary-container text-on-surface-variant hover:text-on-secondary-container flex items-center justify-center transition-colors"
                title="Re-prompt AI"
              >
                <RefreshCw size={14} />
              </button>
              <button 
                onClick={() => setIsEditing(true)}
                className="w-8 h-8 rounded-full bg-surface-container-highest hover:bg-surface-variant text-on-surface-variant flex items-center justify-center transition-colors"
                title="Manual Edit"
              >
                <Edit2 size={14} />
              </button>
              <div className="w-px h-8 bg-outline-variant mx-xs"></div>
              <button 
                onClick={handleDelete}
                disabled={isProcessing}
                className="w-8 h-8 rounded-full bg-surface-container-highest hover:bg-error-container text-on-surface-variant hover:text-error flex items-center justify-center transition-colors disabled:opacity-50"
                title="Reject & Delete"
              >
                <X size={18} />
              </button>
              <button 
                onClick={handleApprove}
                disabled={isProcessing}
                className="w-8 h-8 rounded-full bg-primary hover:bg-primary/90 text-on-primary flex items-center justify-center transition-colors shadow-sm disabled:opacity-50"
                title="Approve"
              >
                <Check size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Reprompt Inline Editor */}
      {isReprompting && !isEditing && (
        <div className="mb-md p-sm bg-secondary-container/20 border border-secondary/30 rounded-lg flex gap-sm">
          <input
            type="text"
            value={repromptInstruction}
            onChange={e => setRepromptInstruction(e.target.value)}
            placeholder="Tell the AI what to fix..."
            className="flex-1 bg-transparent border-b border-secondary/50 focus:outline-none focus:border-secondary text-body-sm"
            onKeyDown={e => e.key === 'Enter' && handleReprompt()}
          />
          <button 
            onClick={handleReprompt}
            disabled={isProcessing || !repromptInstruction.trim()}
            className="px-sm py-xs bg-secondary text-on-secondary rounded text-label-sm disabled:opacity-50"
          >
            {isProcessing ? 'Generating...' : 'Go'}
          </button>
        </div>
      )}
      
      {/* Payload Renderer */}
      <div className={clsx(isProcessing && "opacity-50 pointer-events-none")}>
        {type === 'mcq' && (
          <MCQRenderer payload={isEditing ? editedPayload : payload} isEditing={isEditing} onChange={setEditedPayload} />
        )}
        {type === 'true_false' && (
          <TrueFalseRenderer payload={isEditing ? editedPayload : payload} isEditing={isEditing} onChange={setEditedPayload} />
        )}
        {type === 'fill_in' && (
          <FillInRenderer payload={isEditing ? editedPayload : payload} isEditing={isEditing} onChange={setEditedPayload} />
        )}
        {type === 'applies' && (
          <AppliesRenderer payload={isEditing ? editedPayload : payload} isEditing={isEditing} onChange={setEditedPayload} />
        )}
      </div>
    </div>
  );
};
