import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import type { Question } from '../store/useStore';
import { MCQReview } from './MCQReview';
import { TrueFalseReview } from './TrueFalseReview';
import { FillInReview } from './FillInReview';
import { AppliesReview } from './AppliesReview';
import { EditQuestionModal } from './EditQuestionModal';
import { fetchQuestions, deleteQuestion } from '../api';
import { Loader2, Trash2 } from 'lucide-react';
import { AppModal } from './AppModal';

export const ReviewMode: React.FC = () => {
  const { activeMaterialId, setQuestions, setLoadingQuestions, isLoadingQuestions, setActiveBlockId, documentBlocks, setMode, removeQuestion } = useStore();

  const [approved, setApproved] = useState<Question[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingQuestion, setEditingQuestion] = useState(false);

  // Fetch the latest questions directly from the database on mount to guarantee we get all newly approved ones
  useEffect(() => {
    if (!activeMaterialId) return;
    
    setLoadingQuestions(true);
    fetchQuestions(activeMaterialId)
      .then(qs => {
        setQuestions(qs);
        const approvedQs = qs.filter(q => q.status === 'approved');
        
        // Sort sequentially by block.order
        const blockOrderMap = new Map<string, number>();
        documentBlocks.forEach(b => blockOrderMap.set(b.id, b.order));
        
        approvedQs.sort((a, b) => {
          const orderA = a.block_id ? (blockOrderMap.get(a.block_id) ?? 0) : 0;
          const orderB = b.block_id ? (blockOrderMap.get(b.block_id) ?? 0) : 0;
          return orderA - orderB;
        });
        
        setApproved(approvedQs);
        setHasInitialized(true);
      })
      .catch(err => {
        console.error("Failed to fetch questions for review", err);
        setLoadingQuestions(false);
        setHasInitialized(true);
      });
  }, [activeMaterialId, setQuestions, setLoadingQuestions, documentBlocks]);

  const currentQuestion = approved[currentIndex];

  // Auto-scroll doc sidebar to source block
  useEffect(() => {
    if (currentQuestion && currentQuestion.block_id) {
      setActiveBlockId(currentQuestion.block_id);
    }
  }, [currentIndex, currentQuestion, setActiveBlockId]);

  const handleNext = () => {
    if (currentIndex >= approved.length - 1) {
      setMode('read');
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
    }
  };

  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!questionToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteQuestion(questionToDelete.id);
      const newApproved = approved.filter(q => q.id !== questionToDelete.id);
      setApproved(newApproved);
      
      removeQuestion(questionToDelete.id);

      if (currentIndex >= newApproved.length && currentIndex > 0) {
        setCurrentIndex(i => i - 1);
      }
      setQuestionToDelete(null);
    } catch (err) {
      alert("Failed to delete question.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Spinner while questions are still loading from backend
  if (isLoadingQuestions || !hasInitialized) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant p-xl">
        <Loader2 size={32} className="animate-spin mb-md opacity-50" />
        <p className="opacity-50">Loading review session...</p>
      </div>
    );
  }

  if (approved.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-on-surface-variant p-xl text-center">
        <p>No approved questions available for review.<br /><span className="text-body-sm opacity-70">Switch back to Read mode and approve some questions first.</span></p>
      </div>
    );
  }

  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === approved.length - 1;
  const progressPercent = Math.round(((currentIndex + 1) / approved.length) * 100);

  return (
    <div className="select-text flex-1 flex flex-col items-center justify-start py-xl md:py-[10vh] px-md md:px-xl gap-lg md:overflow-y-auto overscroll-contain bg-surface">
      <div className="w-full max-w-3xl">
        <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden mb-1">
          <div 
            className="bg-primary h-1.5 rounded-full transition-all duration-300 ease-out" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between items-center mb-md">
          <div className="text-label-sm text-on-surface-variant font-bold tracking-widest uppercase flex items-center gap-xs">
            <span>Question {currentIndex + 1} of {approved.length}</span>
          </div>
          <div className="flex gap-sm">
            <button
              onClick={() => setQuestionToDelete(currentQuestion)}
              className="text-error hover:bg-error/10 px-sm py-xs rounded flex items-center gap-xs transition-colors text-label-sm font-bold"
            >
              <Trash2 size={16} />
              Delete
            </button>
            <button
              onClick={() => setEditingQuestion(true)}
              className="text-primary hover:bg-primary/10 px-sm py-xs rounded flex items-center gap-xs transition-colors text-label-sm font-bold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
              Edit Question
            </button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-3xl">
        {currentQuestion.type === 'mcq' && (
          <MCQReview key={currentQuestion.id} question={currentQuestion} onNext={handleNext} onPrev={handlePrev} isLastQuestion={isLastQuestion} isFirstQuestion={isFirstQuestion} />
        )}
        {currentQuestion.type === 'true_false' && (
          <TrueFalseReview key={currentQuestion.id} question={currentQuestion} onNext={handleNext} onPrev={handlePrev} isLastQuestion={isLastQuestion} isFirstQuestion={isFirstQuestion} />
        )}
        {currentQuestion.type === 'fill_in' && (
          <FillInReview key={currentQuestion.id} question={currentQuestion} onNext={handleNext} onPrev={handlePrev} isLastQuestion={isLastQuestion} isFirstQuestion={isFirstQuestion} />
        )}
        {currentQuestion.type === 'applies' && (
          <AppliesReview key={currentQuestion.id} question={currentQuestion} onNext={handleNext} onPrev={handlePrev} isLastQuestion={isLastQuestion} isFirstQuestion={isFirstQuestion} />
        )}
      </div>

      {editingQuestion && (
        <EditQuestionModal
          question={currentQuestion}
          onClose={() => setEditingQuestion(false)}
        />
      )}

      {questionToDelete && (
        <AppModal isOpen={true} onClose={() => setQuestionToDelete(null)} title="Delete Question?" hideCloseButton>
          <div className="flex flex-col items-center text-center mt-md">
            <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center mb-md">
              <Trash2 size={24} />
            </div>
            <p className="text-body-md text-on-surface-variant w-full whitespace-normal break-words">
              Are you sure you want to delete this question? This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-sm mt-xl">
            <button
              onClick={() => setQuestionToDelete(null)}
              disabled={isDeleting}
              className="px-lg py-sm rounded-full text-label-md font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="px-lg py-sm rounded-full text-label-md font-bold bg-error text-on-error hover:bg-error/90 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center min-w-[100px]"
            >
              {isDeleting ? <Loader2 size={18} className="animate-spin" /> : "Delete"}
            </button>
          </div>
        </AppModal>
      )}
    </div>
  );
};
