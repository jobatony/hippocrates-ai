import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { generateQuestion as apiGenerateQuestion, fetchQuestions } from '../api';
import type { Question } from '../store/useStore';

const MAX_CONCURRENT = 7;
const MAX_QUEUE = 20;

export async function triggerGeneration(
  blockId: string,
  selectedText: string,
  type: 'true_false' | 'mcq' | 'fill_in' | 'applies',
  materialId: string
) {
  const store = useStore.getState();
  const { 
    activeRequestCount, 
    queueCount, 
    incrementActiveRequests, 
    decrementActiveRequests, 
    addPendingQuestion, 
    addFailedQuestion,
    setLastPromptSent 
  } = store;

  // Gate check
  if (activeRequestCount >= MAX_CONCURRENT) {
    console.warn('Max concurrent requests reached, ignoring');
    return;
  }
  if (queueCount + activeRequestCount >= MAX_QUEUE) {
    console.warn('Would exceed 20 pending once all in-flight succeed, ignoring');
    return;
  }

  incrementActiveRequests();
  try {
    const newQuestion = await apiGenerateQuestion(blockId, selectedText, type, materialId);
    addPendingQuestion(newQuestion);
    if (newQuestion.prompt_sent) {
      setLastPromptSent(newQuestion.prompt_sent);
    }
  } catch (err: any) {
    console.error("Generation failed:", err);
    const failedQuestion: Question = {
      id: `failed-${Date.now()}-${Math.random()}`,
      type,
      payload: {},
      status: 'failed',
      error: err.message || 'Unknown error during generation',
      generationPayload: { blockId, selectedText, type, materialId },
    };
    addFailedQuestion(failedQuestion);
  } finally {
    decrementActiveRequests();
  }
}

export const useQuestionGeneration = (materialId: string) => {
  const setQuestions = useStore(state => state.setQuestions);
  const setLoadingQuestions = useStore(state => state.setLoadingQuestions);

  useEffect(() => {
    if (!materialId) return;

    const loadQuestions = async () => {
      setLoadingQuestions(true);
      try {
        const questions = await fetchQuestions(materialId);
        setQuestions(questions);
      } catch (err) {
        console.error("Failed to fetch questions:", err);
      }
    };
    
    loadQuestions();
  }, [materialId, setQuestions, setLoadingQuestions]);

  const generateQuestion = async (blockId: string, selectedText: string, type: 'true_false' | 'mcq' | 'fill_in' | 'applies') => {
    await triggerGeneration(blockId, selectedText, type, materialId);
  };

  return { generateQuestion };
};
