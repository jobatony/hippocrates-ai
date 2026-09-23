import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TopNav } from '../components/TopNav';
import { QuizCard as QuizCardComponent } from '../components/QuizCard';
import { useStore } from '../store/useStore';
import { fetchQuizSession, submitCardAnswer } from '../api';
import type { QuizCard } from '../api';
import { X, BadgeCheck, Loader2 } from 'lucide-react';

export const QuizPage: React.FC = () => {
  const navigate = useNavigate();
  const { quizSession, setQuizSession, updateQuizSession } = useStore();

  const [activeQueue, setActiveQueue] = useState<QuizCard[]>([]);
  const [currentCard, setCurrentCard] = useState<QuizCard | null>(null);
  
  const [answered, setAnswered] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchQuizSession()
      .then(session => {
        setQuizSession(session);
        setActiveQueue(session.queue);
      })
      .catch(err => console.error("Failed to load quiz session", err));
  }, [setQuizSession]);

  // Queue runner
  useEffect(() => {
    const checkQueue = () => {
      if (!currentCard && activeQueue.length > 0) {
        const now = Date.now();
        const availableIndex = activeQueue.findIndex(c => c.availableAt <= now);
        if (availableIndex !== -1) {
          const card = activeQueue[availableIndex];
          const newQueue = [...activeQueue];
          newQueue.splice(availableIndex, 1);
          setActiveQueue(newQueue);
          setCurrentCard(card);
        }
      }
    };
    checkQueue();
    const timer = setInterval(checkQueue, 1000);
    return () => clearInterval(timer);
  }, [activeQueue, currentCard]);

  if (!quizSession) {
    return (
      <div className="bg-surface min-h-screen text-on-surface">
        <TopNav />
        <div className="pt-20 flex justify-center items-center h-screen">
          <span className="font-title-lg animate-pulse text-secondary">Loading review session...</span>
        </div>
      </div>
    );
  }

  const { session_total, completed } = quizSession;

  if (session_total === 0 || (activeQueue.length === 0 && !currentCard)) {
    return (
      <div className="bg-surface min-h-screen text-on-surface">
        <TopNav />
        <div className="pt-20 flex flex-col justify-center items-center h-[80vh] gap-4">
          <div className="w-20 h-20 bg-secondary-container/20 text-secondary rounded-full flex items-center justify-center">
            <BadgeCheck size={40} />
          </div>
          <h1 className="font-display-sm">Session Complete 🎉</h1>
          <p className="text-on-surface-variant font-body-lg">Great work! You have no more questions due for review right now.</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-6 py-3 rounded-xl bg-primary-container text-on-primary-fixed font-title-sm hover:brightness-110 transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const percent = session_total > 0 ? Math.round((completed / session_total) * 100) : 0;

  const handleRevealAnswer = (isCorrect: boolean) => {
    setWasCorrect(isCorrect);
    setAnswered(true);
    if (currentCard) {
      setCurrentCard({
        ...currentCard,
        mastery_dots: isCorrect ? Math.min(currentCard.mastery_dots + 1, currentCard.mastery_required) : 0
      });
    }
  };

  const handleNextQuestion = async () => {
    if (!currentCard) return;
    setIsSubmitting(true);
    try {
      const res = await submitCardAnswer(currentCard.id, wasCorrect);
      
      if (res.mastered) {
        // Only increment completion when mastered
        const newCompleted = completed + 1;
        updateQuizSession({ completed: newCompleted });
      } else {
        // Re-insert into queue with backend delay
        const requeuedCard: QuizCard = {
          ...currentCard,
          streak: res.streak,
          mastery_dots: res.streak,
          availableAt: res.available_at
        };
        setActiveQueue(prev => [...prev, requeuedCard].sort((a, b) => a.availableAt - b.availableAt));
      }
      
      setCurrentCard(null);
      setAnswered(false);
    } catch (err) {
      console.error("Failed to submit answer", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col">
      <TopNav />
      
      <div className="flex-1 pt-20 flex flex-col">
        {/* Session Sub-header */}
        <div className="w-full bg-surface-container-lowest/90 backdrop-blur-md sticky top-20 z-40 border-b border-surface-container-lowest">
          <div className="max-w-7xl mx-auto px-spacing-xl py-3 flex items-center justify-between gap-spacing-md">
          <div className="flex items-center gap-spacing-md">
            <Link to="/dashboard" className="group relative flex items-center gap-spacing-xs px-3 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-all text-on-surface-variant hover:text-on-surface">
              <X size={18} />
              <span className="font-label-md text-label-md hidden sm:inline">Exit</span>
            </Link>
            {currentCard && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/30 text-secondary font-label-sm text-label-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                <span className="truncate max-w-[150px] sm:max-w-xs">{currentCard.topic}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-spacing-md">
            <div className="flex items-baseline gap-1.5 text-on-surface-variant font-label-md text-label-md">
              <span className="text-on-surface font-title-sm text-title-sm font-semibold">{completed}</span>
              <span>/</span>
              <span>{session_total}</span>
            </div>
            <span className="hidden sm:inline px-2.5 py-0.5 rounded-full bg-surface-container-highest text-secondary font-label-sm text-label-sm font-semibold">
              {percent}% Complete
            </span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full h-1 bg-surface-variant relative overflow-hidden">
          <div className="h-full bg-primary-container transition-all duration-500 rounded-r-full" style={{ width: `${percent}%` }}></div>
        </div>
      </div>

      <main className="w-full px-4 sm:px-spacing-xl py-8 md:py-10 flex flex-col items-center justify-center flex-1">
        
        {!currentCard ? (
          <div className="flex flex-col items-center gap-4 text-on-surface-variant">
            <Loader2 className="animate-spin text-secondary" size={32} />
            <p className="font-title-sm">Waiting for next card to become available...</p>
            <p className="font-body-sm opacity-70">Taking a short break based on your re-queue timers.</p>
          </div>
        ) : (
          <div className="w-full max-w-4xl bg-surface-container rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-outline font-label-md text-label-md">
                <BadgeCheck size={16} className="text-secondary" />
                <span className="uppercase tracking-wider font-semibold">Question {completed + 1} of {session_total}</span>
              </div>
            </div>

            <QuizCardComponent 
              key={currentCard.id}
              card={currentCard} 
              answered={answered}
              onRevealAnswer={handleRevealAnswer}
            />

            <div className="flex flex-wrap items-center justify-between gap-4 py-2 px-3 rounded-xl bg-surface-container-low mt-2">
              <div className="flex items-center gap-3">
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Mastery Progress:</span>
                <div className="flex items-center gap-1.5" title={`${currentCard.mastery_dots} out of ${currentCard.mastery_required} consecutive correct repetitions`}>
                  {Array.from({ length: currentCard.mastery_required }).map((_, i) => (
                    <span 
                      key={i} 
                      className={`w-3 h-3 rounded-full ${i < currentCard.mastery_dots ? 'bg-secondary shadow-[0_0_8px_rgba(205,189,255,0.6)]' : 'bg-surface-variant'}`}
                    ></span>
                  ))}
                </div>
                <span className="font-label-sm text-label-sm text-outline hidden sm:inline">Get it right {currentCard.mastery_required} times to complete</span>
              </div>
            </div>

            {answered && (
              <div className="animate-in fade-in slide-in-from-bottom-4 mt-4 flex flex-col items-center gap-4">
                <div className={`w-full p-4 rounded-xl flex items-center justify-center gap-2 font-title-md ${
                  wasCorrect ? "bg-secondary-container/30 text-secondary" : "bg-error-container/30 text-error"
                }`}>
                  {wasCorrect ? (
                    <>Correct! You're making progress.</>
                  ) : (
                    <>Incorrect. We'll review this again shortly.</>
                  )}
                </div>
                <button
                  disabled={isSubmitting}
                  onClick={handleNextQuestion}
                  className="w-full md:w-auto px-10 py-4 rounded-xl bg-primary-container text-on-primary-fixed font-title-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Next Question"}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      </div>
    </div>
  );
};
