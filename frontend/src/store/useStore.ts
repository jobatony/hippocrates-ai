import { create } from 'zustand';

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

export interface Question {
  id: string;
  type: 'true_false' | 'mcq' | 'fill_in';
  payload: any;
  status: 'pending' | 'approved' | 'rejected';
}

interface AppState {
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
  setDocumentBlocks: (blocks: Block[]) => void;
  setLoadingDocument: (loading: boolean) => void;

  // Questions queue
  pendingQuestions: Question[];
  queueCount: number;
  addPendingQuestion: (question: Question) => void;
  updateQuestionStatus: (id: string, status: 'approved' | 'rejected') => void;
  removeQuestion: (id: string) => void;
}

export const useStore = create<AppState>((set) => ({
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
  setDocumentBlocks: (blocks) => set({ documentBlocks: blocks }),
  setLoadingDocument: (loading) => set({ isLoadingDocument: loading }),

  // Questions
  pendingQuestions: [],
  queueCount: 0,
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
