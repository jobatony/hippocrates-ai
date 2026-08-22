import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import type { Question } from '../store/useStore';

export const useQuestionWebSocket = (documentId: string) => {
  const addPendingQuestion = useStore(state => state.addPendingQuestion);

  useEffect(() => {
    if (!documentId) return;

    // Using a mock implementation since we don't have a real backend running
    console.log(`Connecting to WS for document ${documentId}`);
    
    // In a real app:
    // const ws = new WebSocket(`ws://localhost:8000/ws/document/${documentId}/`);
    // ws.onmessage = (event) => {
    //   const data = JSON.parse(event.data);
    //   if (data.type === 'question_generated') {
    //     addPendingQuestion(data.question);
    //   }
    // };
    // wsRef.current = ws;

    // return () => {
    //   ws.close();
    // };
  }, [documentId, addPendingQuestion]);

  const mockGenerateQuestion = (_blockId: string, text: string, type: 'true_false' | 'mcq' | 'fill_in') => {
    // Simulate network delay
    setTimeout(() => {
      const newQuestion: Question = {
        id: `q_${Date.now()}`,
        type,
        status: 'pending',
        payload: type === 'mcq' ? {
          question: `Generated MCQ for: "${text.substring(0, 30)}..."`,
          options: ['Option A', 'Option B', 'Option C'],
          answerIndex: 0
        } : type === 'true_false' ? {
          prompt: `Generated T/F for: "${text.substring(0, 30)}..."`,
          statements: [
            { text: 'Statement 1', answer: true },
            { text: 'Statement 2', answer: false }
          ]
        } : {
          text: `Generated fill-in for: "${text.substring(0, 10)}..." {{gap_0}}`,
          options: ['Word1', 'Word2'],
          answers: ['Word1']
        }
      };
      
      // If we had a real websocket we'd just send the request
      // wsRef.current?.send(JSON.stringify({ action: 'generate', blockId, text, type }));
      
      // Mocking receiving it:
      addPendingQuestion(newQuestion);
    }, 1000);
  };

  return { generateQuestion: mockGenerateQuestion };
};
