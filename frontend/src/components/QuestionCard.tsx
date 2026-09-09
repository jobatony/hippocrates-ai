import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import type { Question } from '../store/useStore';
import { approveQuestion, deleteQuestion, regenerateQuestion, updateQuestionPayload } from '../api';
import { Check, X, CheckSquare, Radio, Space as SpaceIcon, Edit2, RefreshCw, Save, ListChecks, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
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
    if (type === 'true_false') return <><CheckSquare size={14} className="shrink-0 mt-[2px]" /> <span className="whitespace-normal break-words leading-tight flex-1">True / False</span></>;
    if (type === 'mcq') return <><Radio size={14} className="shrink-0 mt-[2px]" /> <span className="whitespace-normal break-words leading-tight flex-1">MCQ</span></>;
    if (type === 'fill_in') return <><SpaceIcon size={14} className="shrink-0 mt-[2px]" /> <span className="whitespace-normal break-words leading-tight flex-1">Fill-in Gap</span></>;
    if (type === 'applies') return <><ListChecks size={14} className="shrink-0 mt-[2px]" /> <span className="whitespace-normal break-words leading-tight flex-1">Select All</span></>;
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
      <div className="flex justify-between items-start mb-md gap-sm">
        <div className="flex items-start gap-xs bg-surface-container-high text-on-surface px-sm py-xs rounded text-label-sm shadow-sm w-fit max-w-[45%] sm:max-w-none">
          {renderBadge()}
        </div>
        
        <div className="flex flex-wrap gap-xs justify-end items-center">
          {isEditing ? (
            <div className="flex items-center gap-xs ml-auto">
              <button 
                onClick={() => { setIsEditing(false); setEditedPayload(payload); }}
                disabled={isProcessing}
                className="px-md py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant text-label-sm font-bold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={isProcessing}
                className="px-md py-1.5 rounded-full bg-primary hover:bg-primary/90 text-on-primary text-label-sm font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-xs"
              >
                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save
              </button>
            </div>
          ) : (
            <>
              <button 
                onClick={() => setIsReprompting(!isReprompting)}
                disabled={isProcessing}
                className={clsx(
                  "px-sm py-1.5 rounded-full text-label-sm font-bold flex items-center gap-[4px] transition-colors disabled:opacity-50 border",
                  isReprompting ? "bg-primary/10 text-primary border-primary/20" : "bg-surface text-on-surface-variant hover:text-on-surface border-outline-variant hover:bg-surface-container"
                )}
                title="Reprompt AI"
              >
                <Sparkles size={14} /> <span className="hidden sm:inline">AI Fix</span>
              </button>
              <button 
                onClick={() => { setIsEditing(true); setIsReprompting(false); }}
                disabled={isProcessing}
                className="px-sm py-1.5 rounded-full text-label-sm font-bold flex items-center gap-[4px] transition-colors disabled:opacity-50 border bg-surface text-on-surface-variant hover:text-on-surface border-outline-variant hover:bg-surface-container"
                title="Manual Edit"
              >
                <Edit2 size={14} /> <span className="hidden sm:inline">Edit</span>
              </button>
              
              <div className="w-px h-6 bg-outline-variant mx-1"></div>
              
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
                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Reprompt Inline Editor */}
      {isReprompting && !isEditing && (
        <div className="mb-md mt-sm bg-surface-container-lowest border border-outline-variant rounded-full flex items-center gap-xs shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all overflow-hidden">
          <div className="pl-md py-sm flex items-center justify-center text-primary shrink-0">
            <Sparkles size={16} />
          </div>
          <input
            type="text"
            value={repromptInstruction}
            onChange={e => setRepromptInstruction(e.target.value)}
            placeholder="Tell the AI what to fix..."
            className="flex-1 bg-transparent py-sm px-xs focus:outline-none text-body-sm text-on-surface placeholder:text-on-surface-variant min-w-0"
            onKeyDown={e => e.key === 'Enter' && handleReprompt()}
            disabled={isProcessing}
            autoFocus
          />
          <button 
            onClick={handleReprompt}
            disabled={isProcessing || !repromptInstruction.trim()}
            className="w-8 h-8 mr-xs rounded-full bg-primary hover:bg-primary/90 text-on-primary flex items-center justify-center transition-colors disabled:opacity-50 disabled:bg-surface-container-high disabled:text-on-surface-variant shrink-0"
            title="Generate"
          >
            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
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
