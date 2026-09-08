export interface Question {
  id: string;
  text: string;
  options: string[];
  correctOption: string;
  topic?: string;
}

export const generateMockSession = (): Question[] => {
  const session: Question[] = [];
  for (let i = 1; i <= 120; i++) {
    session.push({
      id: `q_${i}`,
      text: `Mock Medical Question ${i}: What is the primary function of the mock organ?`,
      options: [
        `Correct Function ${i}`,
        `Distractor A ${i}`,
        `Distractor B ${i}`,
        `Distractor C ${i}`
      ],
      correctOption: `Correct Function ${i}`,
      topic: i % 2 === 0 ? 'Cardiology' : 'Neurology'
    });
  }
  return session;
};
