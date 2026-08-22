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
      setDocumentBlocks(detail.blocks as any); // Cast as any if API types misalign slightly
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
