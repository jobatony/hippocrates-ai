import { create } from 'zustand';

export type BlockType = 'heading' | 'paragraph' | 'list_item';

export interface Block {
  id: string;
  parent_id: string | null;
  order: number;
  block_type: BlockType;
  text: string;
}

export interface Question {
  id: string;
  type: 'true_false' | 'mcq' | 'fill_in';
  payload: any;
  status: 'pending' | 'approved' | 'rejected';
}

interface AppState {
  documentBlocks: Block[];
  pendingQuestions: Question[];
  queueCount: number;
  setDocumentBlocks: (blocks: Block[]) => void;
  addPendingQuestion: (question: Question) => void;
  updateQuestionStatus: (id: string, status: 'approved' | 'rejected') => void;
  removeQuestion: (id: string) => void;
}

export const useStore = create<AppState>((set) => ({
  documentBlocks: [
    // Mock data for initial render
    { id: '1', parent_id: null, order: 0, block_type: 'heading', text: 'Diabetes Mellitus Type 2' },
    { id: '2', parent_id: null, order: 1, block_type: 'paragraph', text: 'Type 2 diabetes mellitus is a chronic metabolic disorder characterized by hyperglycemia, insulin resistance, and relative insulin deficiency. Unlike type 1 diabetes, which involves absolute insulin deficiency due to autoimmune destruction of pancreatic beta cells, type 2 diabetes often develops over many years.' },
    { id: '3', parent_id: null, order: 2, block_type: 'paragraph', text: 'The primary pathophysiological defect in type 2 diabetes is a decreased responsiveness of peripheral tissues to insulin, commonly referred to as insulin resistance.' },
    { id: '4', parent_id: null, order: 3, block_type: 'paragraph', text: 'This resistance leads to increased hepatic glucose production and decreased peripheral glucose uptake, particularly in skeletal muscle and adipose tissue.' },
    { id: '5', parent_id: null, order: 4, block_type: 'paragraph', text: 'To compensate for insulin resistance, pancreatic beta cells initially increase insulin secretion, resulting in hyperinsulinemia. However, over time, beta-cell function declines, leading to a progressive decrease in insulin production and the clinical manifestation of hyperglycemia.' },
    { id: '6', parent_id: null, order: 5, block_type: 'heading', text: 'Epidemiology & Risk Factors' },
    { id: '7', parent_id: '6', order: 0, block_type: 'paragraph', text: 'Obesity is the most significant risk factor for type 2 diabetes, with central adiposity being particularly atherogenic and diabetogenic. Other risk factors include physical inactivity, advancing age, and a strong genetic predisposition.' },
  ],
  pendingQuestions: [
      {
          id: 'q1',
          type: 'mcq',
          payload: {
              question: 'What is the primary pathophysiological defect initially observed in Type 2 Diabetes Mellitus?',
              options: [
                  'Autoimmune destruction of beta cells',
                  'Peripheral insulin resistance',
                  'Absolute insulin deficiency'
              ],
              answerIndex: 1
          },
          status: 'pending'
      },
      {
          id: 'q2',
          type: 'true_false',
          payload: {
              prompt: 'Regarding the effects of insulin resistance, are the following statements true or false?',
              statements: [
                  { text: 'Increases hepatic glucose production', answer: true },
                  { text: 'Increases peripheral glucose uptake', answer: false }
              ]
          },
          status: 'pending'
      },
      {
          id: 'q3',
          type: 'fill_in',
          payload: {
              text: 'Type 1 diabetes involves absolute {{gap_0}} deficiency due to {{gap_1}} destruction of pancreatic beta cells.',
              options: ['Insulin', 'Autoimmune', 'Glucagon'],
              answers: ['Insulin', 'Autoimmune']
          },
          status: 'pending'
      }
  ],
  queueCount: 3,
  setDocumentBlocks: (blocks) => set({ documentBlocks: blocks }),
  addPendingQuestion: (question) => set((state) => ({ 
    pendingQuestions: [...state.pendingQuestions, question],
    queueCount: state.queueCount + 1 
  })),
  updateQuestionStatus: (id, status) => set((state) => ({
    pendingQuestions: state.pendingQuestions.map(q => q.id === id ? { ...q, status } : q)
  })),
  removeQuestion: (id) => set((state) => ({
    pendingQuestions: state.pendingQuestions.filter(q => q.id !== id),
    queueCount: Math.max(0, state.queueCount - 1)
  }))
}));

// Utility selector to convert flat array to tree
export const useDocumentTree = () => {
  const blocks = useStore(state => state.documentBlocks);
  
  const buildTree = (parentId: string | null = null): Block[] => {
    return blocks
      .filter(block => block.parent_id === parentId)
      .sort((a, b) => a.order - b.order)
      .map(block => ({
        ...block,
        children: buildTree(block.id)
      }));
  };

  return buildTree(null);
};
