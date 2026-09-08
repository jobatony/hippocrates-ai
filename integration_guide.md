# Hippocrates AI — Frontend ↔ Backend Integration Guide
## Document Parsing: Making It Fully Functional

> **Scope:** This guide connects the existing React frontend to the Django backend  
> so that real `.docx` files can be uploaded, parsed, and displayed in the reader.  
> It covers only the **document parsing** feature — question generation comes later.

---

## Pre-flight: What We Have & What Needs to Change

### ✅ What already lines up perfectly

| Frontend | Backend | Status |
|---|---|---|
| `Block` interface (`id`, `parent_id`, `order`, `block_type`, `text`) | `BlockSerializer` returns those exact fields | ✅ Perfect match |
| `useDocumentTree()` rebuilds tree from flat array via `parent_id` | API returns flat array with `parent_id` | ✅ Perfect match |
| `setDocumentBlocks()` action in Zustand store | Just needs to be called after a fetch | ✅ Ready |
| `useStore` already defines `BlockType` as `'heading' \| 'paragraph' \| 'list_item'` | Backend emits `heading_1`, `heading_2`, `heading_3`, `paragraph`, `list_item` | ⚠️ **Type mismatch — needs fix** |
| `BlockNode` renders `'heading'` case | Backend never emits `'heading'` (it sends `heading_1`, `heading_2`, `heading_3`) | ⚠️ **Needs fix in BlockNode** |
| Left sidebar has hardcoded material links | Should render real materials fetched from `GET /api/materials/` | ❌ **Needs new code** |
| `DocumentRenderer` header is hardcoded ("Diabetes Mellitus Type 2") | Should show the real material title | ❌ **Needs new code** |
| "Add New Material" button does nothing | Should open a file upload dialog | ❌ **Needs new code** |
| Zustand store starts with hardcoded mock `documentBlocks` | Should start empty and be populated by API | ❌ **Needs change** |
| No `api.ts` helper file exists | Need one central place for all fetch calls | ❌ **Needs creating** |

### One critical type mismatch to fix first

The backend emits granular heading types (`heading_1`, `heading_2`, `heading_3`) but the frontend `BlockType` only knows `'heading'`. This needs to be expanded in the store **and** in `BlockNode` to use the right heading level (h2, h3, h4) for proper visual hierarchy.

---

## Step 1 — Fix the Type Mismatch in the Zustand Store

**File:** `frontend/src/store/useStore.ts`

Change the `BlockType` union to match what the backend actually sends:

```typescript
// BEFORE
export type BlockType = 'heading' | 'paragraph' | 'list_item';

// AFTER
export type BlockType = 
  | 'heading_1' 
  | 'heading_2' 
  | 'heading_3' 
  | 'paragraph' 
  | 'list_item';
```

Also add a `Material` type and new state fields, and **clear the mock data**:

```typescript
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
```

---

## Step 2 — Fix `BlockNode` to Handle Granular Heading Levels

**File:** `frontend/src/components/BlockNode.tsx`

Update the `renderContent` switch to handle all heading types:

```typescript
import React from 'react';
import type { Block } from '../store/useStore';

interface BlockNodeProps {
  block: Block & { children?: (Block & { children?: any[] })[] };
}

export const BlockNode: React.FC<BlockNodeProps> = ({ block }) => {
  const { id, block_type, text, children } = block;

  const renderContent = () => {
    switch (block_type) {
      case 'heading_1':
        return <h2 className="font-display-sm text-on-surface mb-xs mt-xl">{text}</h2>;
      case 'heading_2':
        return <h3 className="font-headline-md text-on-surface mb-xs mt-lg">{text}</h3>;
      case 'heading_3':
        return <h4 className="font-headline-sm text-on-surface-variant mb-xs mt-md">{text}</h4>;
      case 'paragraph':
        return <p className="mb-md text-body-lg text-on-surface leading-relaxed">{text}</p>;
      case 'list_item':
        return <li className="ml-md list-disc text-body-lg text-on-surface">{text}</li>;
      default:
        return <p className="mb-md text-body-lg">{text}</p>;
    }
  };

  return (
    <div data-block-id={id} className="relative group p-xs -mx-xs rounded hover:bg-surface-container-lowest transition-colors">
      {renderContent()}
      {children && children.length > 0 && (
        <div className="pl-4">
          {children.map(child => (
            <BlockNode key={child.id} block={child} />
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## Step 3 — Create a Central API Helper

**Create new file:** `frontend/src/api.ts`

This file is the single place all HTTP calls to Django live. Nothing else in the app calls `fetch()` directly.

```typescript
// frontend/src/api.ts
// Central API client for the Hippocrates Django backend

const BASE_URL = 'http://127.0.0.1:8000/api';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ApiMaterial {
  id: string;
  title: string;
  status: 'pending' | 'parsing' | 'ready' | 'failed';
  created_at: string;
}

export interface ApiBlock {
  id: string;
  parent_id: string | null;
  order: number;
  block_type: 'heading_1' | 'heading_2' | 'heading_3' | 'paragraph' | 'list_item';
  text: string;
}

export interface ApiMaterialDetail extends ApiMaterial {
  blocks: ApiBlock[];
}

export interface ApiUploadResponse {
  id: string;
  title: string;
  status: string;
  blocks_created: number;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * GET /api/materials/
 * Returns a list of all uploaded materials (no blocks embedded).
 */
export async function fetchMaterials(): Promise<ApiMaterial[]> {
  const res = await fetch(`${BASE_URL}/materials/`);
  if (!res.ok) throw new Error(`Failed to fetch materials: ${res.statusText}`);
  return res.json();
}

/**
 * GET /api/materials/<id>/
 * Returns a material and its complete flat block array.
 */
export async function fetchMaterialDetail(id: string): Promise<ApiMaterialDetail> {
  const res = await fetch(`${BASE_URL}/materials/${id}/`);
  if (!res.ok) throw new Error(`Failed to fetch material: ${res.statusText}`);
  return res.json();
}

/**
 * POST /api/materials/
 * Uploads a .docx file, triggers parsing, returns the created material.
 */
export async function uploadMaterial(
  title: string, 
  file: File
): Promise<ApiUploadResponse> {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/materials/`, {
    method: 'POST',
    body: formData,
    // Do NOT set Content-Type here — the browser sets it with the boundary
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.detail || `Upload failed: ${res.statusText}`);
  }

  return res.json();
}

/**
 * DELETE /api/materials/<id>/
 * Deletes a material and all its blocks.
 */
export async function deleteMaterial(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/materials/${id}/`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Delete failed: ${res.statusText}`);
}
```

---

## Step 4 — Rewrite the Sidebar to Load Real Materials

**File:** `frontend/src/components/Layout.tsx`

Replace the hardcoded nav links with a real data-driven sidebar. Add an upload modal:

```typescript
import React, { useEffect, useRef, useState } from 'react';
import { DocumentRenderer } from './DocumentRenderer';
import { QuestionRenderer } from './QuestionRenderer';
import { useStore } from '../store/useStore';
import { Book, Settings, Plus, Search, User, Upload, Loader2, X } from 'lucide-react';
import { fetchMaterials, fetchMaterialDetail, uploadMaterial } from '../api';

export const Layout: React.FC = () => {
  const {
    pendingQuestions, queueCount,
    materials, setMaterials, addMaterial,
    activeMaterialId, setActiveMaterial,
    setDocumentBlocks, setLoadingDocument,
  } = useStore();

  const MAX_QUEUE = 20;

  // Upload modal state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load materials list on mount
  useEffect(() => {
    fetchMaterials()
      .then(setMaterials)
      .catch(err => console.error('Failed to load materials:', err));
  }, [setMaterials]);

  // Load a material's blocks when one is selected from the sidebar
  const handleSelectMaterial = async (id: string, title: string) => {
    if (activeMaterialId === id) return;
    setActiveMaterial(id, title);
    setLoadingDocument(true);
    setDocumentBlocks([]);
    try {
      const detail = await fetchMaterialDetail(id);
      setDocumentBlocks(detail.blocks);
    } catch (err) {
      console.error('Failed to load document:', err);
    } finally {
      setLoadingDocument(false);
    }
  };

  // Handle upload form submission
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle.trim()) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await uploadMaterial(uploadTitle.trim(), uploadFile);
      // Add to sidebar immediately with 'ready' status
      addMaterial({
        id: result.id,
        title: result.title,
        status: 'ready',
        created_at: new Date().toISOString(),
      });
      // Auto-select the newly uploaded material
      await handleSelectMaterial(result.id, result.title);
      setShowUpload(false);
      setUploadTitle('');
      setUploadFile(null);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background font-body-md text-on-surface overflow-hidden">

      {/* Left Sidebar */}
      <aside className="w-72 bg-surface-container-low border-r border-outline-variant z-50 flex flex-col shrink-0">
        <div className="p-md flex items-center gap-sm border-b border-outline-variant h-16">
          <span className="font-headline-md text-on-surface tracking-tight font-bold">Hippocrates AI</span>
        </div>

        <div className="flex-1 overflow-y-auto px-sm py-md space-y-xs">
          <div className="px-sm mb-xs text-label-sm text-on-surface-variant uppercase">Library</div>
          <nav className="space-y-xs">
            {materials.length === 0 && (
              <p className="px-sm text-label-sm text-on-surface-variant opacity-60">
                No materials yet. Upload a .docx file to get started.
              </p>
            )}
            {materials.map(material => (
              <button
                key={material.id}
                onClick={() => handleSelectMaterial(material.id, material.title)}
                className={`w-full flex items-center px-md py-sm transition-colors rounded-lg text-left gap-sm ${
                  activeMaterialId === material.id
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'text-on-surface-variant hover:bg-surface-container-highest'
                }`}
              >
                <Book size={18} className="shrink-0" />
                <span className="truncate text-label-md">{material.title}</span>
                {material.status === 'parsing' && (
                  <Loader2 size={14} className="ml-auto shrink-0 animate-spin" />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-md border-t border-outline-variant">
          <button
            onClick={() => setShowUpload(true)}
            className="w-full flex items-center justify-center gap-sm bg-primary text-on-primary py-sm rounded-lg font-label-md hover:bg-primary-container transition-all"
          >
            <Plus size={18} />
            Add New Material
          </button>
        </div>

        <div className="p-md border-t border-outline-variant">
          <a href="#" className="flex items-center gap-sm text-on-surface-variant hover:text-on-surface transition-colors">
            <Settings size={18} />
            <span className="text-label-md">Fine-tune AI prompt</span>
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface">
        <header className="h-16 flex items-center justify-between px-xl bg-surface/80 backdrop-blur-xl z-40 border-b border-outline-variant">
          <div className="flex items-center bg-surface-container-lowest p-xs rounded-full border border-outline-variant">
            <button className="px-lg py-1 rounded-full text-label-md bg-surface-container text-on-surface">Read</button>
            <button className="px-lg py-1 rounded-full text-label-md text-on-surface-variant hover:text-on-surface">Review</button>
          </div>
          <div className="flex items-center gap-md">
            <Search size={20} className="text-on-surface-variant cursor-pointer hover:text-on-surface" />
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer">
              <User size={18} className="text-on-primary" />
            </div>
          </div>
        </header>

        <main className="flex-1 flex min-h-0 relative">
          <DocumentRenderer />

          {/* Right Panel: AI Review Queue */}
          <aside className="w-96 bg-surface-container flex flex-col shrink-0 border-l border-outline-variant">
            <header className="h-16 flex items-center justify-between px-md border-b border-outline-variant bg-surface-container-high shrink-0">
              <div className="font-headline-md text-on-surface text-[16px]">Review Queue</div>
              <div className="bg-surface-container-lowest px-sm py-xs rounded border border-outline-variant flex items-center gap-xs">
                <span className="text-label-sm text-on-surface-variant">Pending:</span>
                <span className="text-label-sm font-bold text-primary">{queueCount} / {MAX_QUEUE}</span>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-md space-y-md">
              {pendingQuestions.filter(q => q.status === 'pending').map((question) => (
                <QuestionRenderer key={question.id} question={question} />
              ))}
              {pendingQuestions.filter(q => q.status === 'pending').length === 0 && (
                <div className="flex flex-col items-center justify-center py-xl text-on-surface-variant text-center h-full opacity-50">
                  <p>No pending questions.</p>
                  <p className="text-label-sm mt-xs">Highlight text in the document to generate questions.</p>
                </div>
              )}
            </div>
          </aside>
        </main>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
          <div className="bg-surface-container rounded-2xl p-xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-lg">
              <h2 className="font-headline-md text-on-surface">Upload Study Material</h2>
              <button onClick={() => setShowUpload(false)} className="text-on-surface-variant hover:text-on-surface">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-md">
              <div>
                <label className="block text-label-md text-on-surface-variant mb-xs">Title</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  placeholder="e.g. Diabetes Mellitus Notes"
                  className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-label-md text-on-surface-variant mb-xs">.docx File</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-outline-variant rounded-lg p-lg flex flex-col items-center gap-sm cursor-pointer hover:border-primary transition-colors"
                >
                  <Upload size={24} className="text-on-surface-variant" />
                  <span className="text-label-md text-on-surface-variant">
                    {uploadFile ? uploadFile.name : 'Click to select a .docx file'}
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx"
                  className="hidden"
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                  required
                />
              </div>

              {uploadError && (
                <p className="text-label-sm text-error">{uploadError}</p>
              )}

              <button
                type="submit"
                disabled={isUploading || !uploadFile || !uploadTitle.trim()}
                className="w-full bg-primary text-on-primary py-sm rounded-lg font-label-md flex items-center justify-center gap-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-container transition-all"
              >
                {isUploading ? (
                  <><Loader2 size={16} className="animate-spin" /> Parsing document...</>
                ) : (
                  <><Upload size={16} /> Upload & Parse</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## Step 5 — Update `DocumentRenderer` to Use Real State

**File:** `frontend/src/components/DocumentRenderer.tsx`

Replace the hardcoded header with real material title and add an empty state:

```typescript
import React from 'react';
import { useDocumentTree, useStore } from '../store/useStore';
import { BlockNode } from './BlockNode';
import { useTextSelection } from '../hooks/useTextSelection';
import { useQuestionWebSocket } from '../hooks/useQuestionWebSocket';
import { CheckSquare, Radio, Space, Loader2, FileText } from 'lucide-react';

export const DocumentRenderer: React.FC = () => {
  const tree = useDocumentTree();
  const { selection, clearSelection } = useTextSelection();
  const queueCount = useStore(state => state.queueCount);
  const activeMaterialId = useStore(state => state.activeMaterialId);
  const activeMaterialTitle = useStore(state => state.activeMaterialTitle);
  const isLoadingDocument = useStore(state => state.isLoadingDocument);

  const { generateQuestion } = useQuestionWebSocket(activeMaterialId || '');
  const MAX_QUEUE = 20;
  const isQueueFull = queueCount >= MAX_QUEUE;

  const handleGenerate = (type: 'true_false' | 'mcq' | 'fill_in') => {
    if (selection && selection.blockId) {
      generateQuestion(selection.blockId, selection.text, type);
      clearSelection();
    }
  };

  // Empty state — no material selected yet
  if (!activeMaterialId && !isLoadingDocument) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-w-0 bg-surface text-on-surface-variant">
        <FileText size={48} className="mb-md opacity-30" />
        <p className="font-headline-sm opacity-50">Select a material from the sidebar to start reading.</p>
      </div>
    );
  }

  // Loading state
  if (isLoadingDocument) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-w-0 bg-surface text-on-surface-variant">
        <Loader2 size={32} className="animate-spin mb-md opacity-50" />
        <p className="text-label-md opacity-50">Loading document...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-surface p-xl overflow-y-auto relative h-full">
      <div className="max-w-3xl mx-auto w-full relative">
        <header className="mb-xl">
          <h1 className="font-display-lg text-on-surface mb-sm">{activeMaterialTitle}</h1>
          <div className="flex items-center gap-md text-label-md text-on-surface-variant">
            <span>{tree.length} sections</span>
          </div>
        </header>

        <div className="space-y-sm">
          {tree.map(block => (
            <BlockNode key={block.id} block={block} />
          ))}
        </div>

        {/* Floating Action Button (FAB) */}
        {selection && selection.rect && (
          <div
            className="fab-container fixed z-50 transform -translate-x-1/2 -translate-y-full pb-4"
            style={{
              top: selection.rect.top,
              left: selection.rect.left + selection.rect.width / 2,
            }}
          >
            <div className="bg-surface-container-highest shadow-xl rounded-xl p-xs flex items-center gap-xs">
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-surface-container-highest"></div>
              {isQueueFull ? (
                <div className="px-md py-sm text-error font-label-sm whitespace-nowrap">
                  Review pending questions before generating more.
                </div>
              ) : (
                <>
                  <button onClick={() => handleGenerate('true_false')} className="px-md py-sm bg-surface-container hover:bg-surface-container-low text-on-surface rounded-lg font-label-sm whitespace-nowrap flex items-center gap-xs transition-colors">
                    <CheckSquare size={16} /> T/F
                  </button>
                  <button onClick={() => handleGenerate('mcq')} className="px-md py-sm bg-surface-container hover:bg-surface-container-low text-on-surface rounded-lg font-label-sm whitespace-nowrap flex items-center gap-xs transition-colors">
                    <Radio size={16} /> MCQ
                  </button>
                  <button onClick={() => handleGenerate('fill_in')} className="px-md py-sm bg-surface-container hover:bg-surface-container-low text-on-surface rounded-lg font-label-sm whitespace-nowrap flex items-center gap-xs transition-colors">
                    <Space size={16} /> Fill-in
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

## Step 6 — Run Both Servers

You need **two terminal windows** open simultaneously.

### Terminal 1 — Django Backend

```bash
cd "C:\Users\HP\Desktop\Distinction AI\backend"
.\venv\Scripts\activate
python manage.py runserver
```

You should see:
```
Starting development server at http://127.0.0.1:8000/
```

### Terminal 2 — React Frontend

```bash
cd "C:\Users\HP\Desktop\Distinction AI\frontend"
npm run dev
```

You should see:
```
VITE v8.x  ready in 300ms
➜  Local:  http://localhost:5173/
```

---

## Step 7 — Verify the Integration End-to-End

Follow these exact steps to confirm everything works:

1. **Open** `http://localhost:5173/` in your browser.
2. **Check sidebar:** It should say "No materials yet." (confirming mock data was removed).
3. **Click "Add New Material"** — the upload modal should appear.
4. **Fill in a title** and **select a `.docx` file** from your computer.
5. **Click "Upload & Parse"** — the button should show a spinner while Django parses the file.
6. **After upload completes:**
   - The modal closes automatically.
   - The new material appears in the left sidebar.
   - The document is immediately displayed in the reader with the real parsed content.
7. **Verify the tree hierarchy:** Headings from your `.docx` should render visually larger than body paragraphs.
8. **Test text selection:** Click and drag over any paragraph — the FAB (T/F, MCQ, Fill-in buttons) should appear above the highlighted text.
9. **Click the FAB buttons** — mock questions should still appear in the right panel (real AI generation comes later).

---

## Step 8 — Save & Push to GitHub

```bash
cd "C:\Users\HP\Desktop\Distinction AI"
git add frontend/src/
git commit -m "feat: connect React frontend to Django document parsing API"
git push origin main
```

---

## Summary of All File Changes

| File | Change |
|---|---|
| `frontend/src/store/useStore.ts` | Expanded `BlockType` to include `heading_1/2/3`; added `Material` type, `materials`, `activeMaterialId`, `isLoadingDocument` state; cleared mock data |
| `frontend/src/components/BlockNode.tsx` | Updated `switch` to render `h2/h3/h4` for granular heading levels |
| `frontend/src/api.ts` | **Created new.** Central HTTP client with `fetchMaterials`, `fetchMaterialDetail`, `uploadMaterial` |
| `frontend/src/components/Layout.tsx` | Sidebar now fetches and renders real materials; "Add New Material" opens a functional upload modal |
| `frontend/src/components/DocumentRenderer.tsx` | Shows real material title; added loading and empty states |

---

## What's Not Connected Yet (Next Steps)

- **The FAB still generates mock questions** — real question generation needs the AI/LLM layer (Phase 2).
- **No error toast/notification** — upload errors only appear inline in the modal.
- **No delete UI** — materials can be deleted via Django Admin or API directly.
- **No "parsing" status polling** — since we do synchronous parsing, this is fine for now.
