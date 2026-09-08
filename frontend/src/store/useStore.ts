import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '../api';

export type BlockType = 
  | 'heading_1' 
  | 'heading_2' 
  | 'heading_3' 
  | 'paragraph' 
  | 'list_item';

export interface Block {
  id: string;
  parent_id: string | null;
  order: number;
  block_type: BlockType;
  text: string;
}

export interface Material {
  id: string;
  title: string;
  status: 'pending' | 'parsing' | 'ready' | 'failed';
  created_at: string;
}

export interface MCQPayload {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface TrueFalseStatementPayload {
  true_statement: string;
  false_alternative: string;
}

export interface TrueFalsePayload {
  stem: string;
  statements: TrueFalseStatementPayload[];
}

export interface FillInOptionPayload {
  text: string;
  correct_for_gaps: number[];
}

export interface FillInPayload {
  question_text: string;
  answer_bank: FillInOptionPayload[];
  gap_count: number;
}

export interface AppliesPayload {
  question: string;
  correct_options: string[];
  wrong_options: string[];
}

export interface Question {
  id: string;
  type: 'true_false' | 'mcq' | 'fill_in' | 'applies';
  payload: any; // Can be cast to specific type in components
  status: 'pending' | 'approved' | 'rejected' | 'failed';
  prompt_sent?: string;
  block_id?: string;
  error?: string;
  generationPayload?: {
    blockId: string;
    selectedText: string;
    type: string;
    materialId: string;
  };
}

interface AppState {
  // Auth
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  setCurrentUser: (user: AuthUser | null) => void;
  logout: () => void;

  // App Mode
  mode: 'read' | 'review';
  setMode: (mode: 'read' | 'review') => void;

  // Materials list (sidebar)
  materials: Material[];
  setMaterials: (materials: Material[]) => void;
  addMaterial: (material: Material) => void;

  // Currently open material
  activeMaterialId: string | null;
  activeMaterialTitle: string;
  setActiveMaterial: (id: string, title: string) => void;

  // Document blocks
  documentBlocks: Block[];
  isLoadingDocument: boolean;
  activeBlockId: string | null;
  setDocumentBlocks: (blocks: Block[]) => void;
  setLoadingDocument: (loading: boolean) => void;
  setActiveBlockId: (id: string | null) => void;

  // Questions queue
  pendingQuestions: Question[];
  queueCount: number;
  isLoadingQuestions: boolean;
  currentReviewQuestionId: string | null;
  lastPromptSent: { text: string; timestamp: number } | null;
  
  setQuestions: (questions: Question[]) => void;
  setLoadingQuestions: (loading: boolean) => void;
  setCurrentReviewQuestionId: (id: string | null) => void;
  addPendingQuestion: (question: Question) => void;
  addFailedQuestion: (question: Question) => void;
  updateQuestionStatus: (id: string, status: 'approved' | 'rejected') => void;
  updateQuestionPayload: (id: string, payload: any) => void;
  removeQuestion: (id: string) => void;
  setLastPromptSent: (prompt: string | null) => void;

  // Concurrency
  activeRequestCount: number;
  incrementActiveRequests: () => void;
  decrementActiveRequests: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth
      currentUser: null,
      isAuthenticated: !!localStorage.getItem('access_token'),
      setCurrentUser: (user) => set({ currentUser: user, isAuthenticated: !!user }),
      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({
          currentUser: null,
          isAuthenticated: false,
          materials: [],
          activeMaterialId: null,
          activeMaterialTitle: '',
          documentBlocks: [],
          pendingQuestions: [],
          queueCount: 0,
        });
      },

      // App Mode
      mode: 'read',
  setMode: (mode) => set({ mode }),
  // Materials
  materials: [],
  setMaterials: (materials) => set({ materials }),
  addMaterial: (material) => set((state) => ({ 
    materials: [material, ...state.materials] 
  })),

  // Active material
  activeMaterialId: null,
  activeMaterialTitle: '',
  setActiveMaterial: (id, title) => set({ activeMaterialId: id, activeMaterialTitle: title }),

  // Document blocks — start EMPTY, filled by API
  documentBlocks: [],
  isLoadingDocument: false,
  activeBlockId: null,
  setDocumentBlocks: (blocks) => set({ documentBlocks: blocks }),
  setLoadingDocument: (loading) => set({ isLoadingDocument: loading }),
  setActiveBlockId: (id) => set({ activeBlockId: id }),

  // Questions
  pendingQuestions: [],
  queueCount: 0,
  isLoadingQuestions: true,
  currentReviewQuestionId: null,
  lastPromptSent: null,

  setQuestions: (questions) => set({ 
    pendingQuestions: questions,
    queueCount: questions.filter(q => q.status === 'pending').length,
    isLoadingQuestions: false
  }),
  
  setLoadingQuestions: (loading) => set({ isLoadingQuestions: loading }),
  setCurrentReviewQuestionId: (id) => set({ currentReviewQuestionId: id }),

  addPendingQuestion: (question) => set((state) => ({
    pendingQuestions: [question, ...state.pendingQuestions],
    queueCount: state.queueCount + 1
  })),

  addFailedQuestion: (question) => set((state) => ({
    pendingQuestions: [question, ...state.pendingQuestions],
  })),
  
  updateQuestionStatus: (id, status) => set((state) => ({
    pendingQuestions: state.pendingQuestions.map(q => q.id === id ? { ...q, status } : q),
    queueCount: status !== 'pending' ? Math.max(0, state.queueCount - 1) : state.queueCount
  })),
  
  updateQuestionPayload: (id, payload) => set((state) => ({
    pendingQuestions: state.pendingQuestions.map(q => q.id === id ? { ...q, payload } : q)
  })),
  
  removeQuestion: (id) => set((state) => {
    const q = state.pendingQuestions.find(q => q.id === id);
    const wasCountable = q && q.status === 'pending';
    return {
      pendingQuestions: state.pendingQuestions.filter(q => q.id !== id),
      queueCount: wasCountable ? Math.max(0, state.queueCount - 1) : state.queueCount,
    };
  }),

  setLastPromptSent: (prompt) => set({ 
    lastPromptSent: prompt ? { text: prompt, timestamp: Date.now() } : null 
  }),

  activeRequestCount: 0,
  incrementActiveRequests: () => set(state => ({ activeRequestCount: state.activeRequestCount + 1 })),
  decrementActiveRequests: () => set(state => ({ activeRequestCount: Math.max(0, state.activeRequestCount - 1) })),
}), {
  name: 'hippocrates-storage',
  partialize: (state) => ({
    mode: state.mode,
    activeMaterialId: state.activeMaterialId,
    activeMaterialTitle: state.activeMaterialTitle,
  }),
}));

// Selector: rebuild tree from flat block array using parent_id references
export const useDocumentTree = () => {
  const blocks = useStore(state => state.documentBlocks);

  const buildTree = (parentId: string | null = null): (Block & { children: Block[] })[] => {
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
