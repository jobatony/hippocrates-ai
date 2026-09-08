import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import type { Question } from '../store/useStore';
import { MCQReview } from './MCQReview';
import { TrueFalseReview } from './TrueFalseReview';
import { FillInReview } from './FillInReview';
import { AppliesReview } from './AppliesReview';
import { ResultsSummary } from './ResultsSummary';
import { EditQuestionModal } from './EditQuestionModal';
import { logAttempt } from '../api';
import { Loader2 } from 'lucide-react';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const ReviewMode: React.FC = () => {
  const { pendingQuestions, isLoadingQuestions, setActiveBlockId } = useStore();

  const [approved, setApproved] = useState<Question[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<{ questionId: string; correct: boolean }[]>([]);
  const [sessionDone, setSessionDone] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(false);

  // Wait for questions to finish loading, then build the shuffled list from scratch
  useEffect(() => {
    if (!isLoadingQuestions && !hasInitialized) {
      const approvedQs = pendingQuestions.filter(q => q.status === 'approved');
      setApproved(shuffle(approvedQs));
      setHasInitialized(true);
    }
  }, [isLoadingQuestions, pendingQuestions, hasInitialized]);

  const currentQuestion = approved[currentIndex];

  // Auto-scroll doc sidebar to source block
  useEffect(() => {
    if (currentQuestion && currentQuestion.block_id) {
      setActiveBlockId(currentQuestion.block_id);
    }
  }, [currentIndex, currentQuestion, setActiveBlockId]);

  const handleAnswer = (correct: boolean) => {
    logAttempt(currentQuestion.id, correct, {});
    setResults(prev => [...prev, { questionId: currentQuestion.id, correct }]);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= approved.length) {
      setSessionDone(true);
    } else {
      setCurrentIndex(i => i + 1);
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

  if (sessionDone) {
    return <ResultsSummary results={results} total={approved.length} />;
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-start py-[10vh] px-xl gap-lg overflow-y-auto bg-surface">
      <div className="w-full max-w-3xl flex justify-between items-center mb-md">
        <div className="text-label-sm text-on-surface-variant font-bold tracking-widest uppercase">
          Question {currentIndex + 1} / {approved.length}
        </div>
        <button
          onClick={() => setEditingQuestion(true)}
          className="text-primary hover:bg-primary/10 px-sm py-xs rounded flex items-center gap-xs transition-colors text-label-sm font-bold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
          Edit Question
        </button>
      </div>

      <div className="w-full max-w-3xl">
        {currentQuestion.type === 'mcq' && (
          <MCQReview key={currentQuestion.id} question={currentQuestion} onAnswer={handleAnswer} onNext={handleNext} />
        )}
        {currentQuestion.type === 'true_false' && (
          <TrueFalseReview key={currentQuestion.id} question={currentQuestion} onAnswer={handleAnswer} onNext={handleNext} />
        )}
        {currentQuestion.type === 'fill_in' && (
          <FillInReview key={currentQuestion.id} question={currentQuestion} onAnswer={handleAnswer} onNext={handleNext} />
        )}
        {currentQuestion.type === 'applies' && (
          <AppliesReview key={currentQuestion.id} question={currentQuestion} onAnswer={handleAnswer} onNext={handleNext} />
        )}
      </div>

      {editingQuestion && (
        <EditQuestionModal
          question={currentQuestion}
          onClose={() => setEditingQuestion(false)}
        />
      )}
    </div>
  );
};
