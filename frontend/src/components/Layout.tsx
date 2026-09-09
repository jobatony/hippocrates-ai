import React, { useEffect, useRef, useState } from 'react';
import { DocumentRenderer } from './DocumentRenderer';
import { QuestionCard } from './QuestionCard';
import { ReviewMode } from './ReviewMode';
import { useStore } from '../store/useStore';
import { Book, Settings, Plus, User, Upload, Loader2, X, Menu, ClipboardList, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { fetchMaterials, fetchMaterialDetail, uploadMaterial, fetchQuestions, logout as logoutApi, renameMaterial, deleteMaterial } from '../api';
import type { Material } from '../store/useStore';

const MaterialNavItem: React.FC<{
  material: Material;
  isActive: boolean;
  onSelect: () => void;
  onRename: (id: string, newTitle: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}> = ({ material, isActive, onSelect, onRename, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(material.title);
  const [showMenu, setShowMenu] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRename = async () => {
    if (editTitle.trim() === '' || editTitle === material.title) {
      setIsEditing(false);
      setEditTitle(material.title);
      return;
    }
    setIsProcessing(true);
    await onRename(material.id, editTitle);
    setIsEditing(false);
    setIsProcessing(false);
  };

  return (
    <div 
      className={`group relative w-full flex items-center px-md py-sm transition-colors rounded-lg text-left gap-sm ${
        isActive
          ? 'bg-secondary-container text-on-secondary-container'
          : 'text-on-surface-variant hover:bg-surface-container-highest'
      }`}
      onMouseLeave={() => setShowMenu(false)}
    >
      <button onClick={onSelect} className="shrink-0">
        <Book size={18} />
      </button>

      {isEditing ? (
        <input
          autoFocus
          className="flex-1 min-w-0 bg-transparent border-b border-primary focus:outline-none text-label-md"
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          onBlur={handleRename}
          onKeyDown={e => {
            if (e.key === 'Enter') handleRename();
            if (e.key === 'Escape') {
              setIsEditing(false);
              setEditTitle(material.title);
            }
          }}
          disabled={isProcessing}
        />
      ) : (
        <button onClick={onSelect} className="flex-1 min-w-0 text-left truncate text-label-md">
          {material.title}
        </button>
      )}

      {material.status === 'parsing' ? (
        <Loader2 size={14} className="shrink-0 animate-spin" />
      ) : (
        <div className="shrink-0 relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className={`p-1 rounded hover:bg-surface-variant transition-colors ${showMenu ? 'opacity-100' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'}`}
          >
            <MoreVertical size={14} />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-50 p-1 flex flex-col gap-[2px]">
              <button
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); setShowMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container flex items-center gap-2 text-label-md text-on-surface transition-colors"
              >
                <Pencil size={14} className="text-on-surface-variant" /> Rename
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(material.id); setShowMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-error-container text-error flex items-center gap-2 text-label-md transition-colors"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const Layout: React.FC = () => {
  const {
    mode, setMode, activeBlockId,
    pendingQuestions, queueCount,
    materials, setMaterials, addMaterial,
    activeMaterialId, setActiveMaterial,
    setDocumentBlocks, setLoadingDocument,
    setQuestions, setLoadingQuestions,
    currentUser, logout, setCurrentUser, isAuthenticated,
    activeRequestCount
  } = useStore();

  useEffect(() => {
    if (isAuthenticated && !currentUser) {
      import('../api').then(({ fetchMe }) => {
        fetchMe()
          .then(setCurrentUser)
          .catch(() => logout());
      });
    }
  }, [isAuthenticated, currentUser, setCurrentUser, logout]);

  const MAX_QUEUE = 20;

  // On mobile sidebars default to closed; on desktop they default open
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isDocDrawerOpen, setIsDocDrawerOpen] = useState(false);

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
      .then(fetchedMaterials => {
        setMaterials(fetchedMaterials);
        // If the persisted active material is no longer in the DB, clear it
        if (activeMaterialId && !fetchedMaterials.find(m => m.id === activeMaterialId)) {
          setActiveMaterial(null as any, '');
          setDocumentBlocks([]);
        }
      })
      .catch(err => console.error('Failed to load materials:', err));
  }, [setMaterials, activeMaterialId, setActiveMaterial, setDocumentBlocks]);

  // Fetch questions whenever activeMaterialId changes
  useEffect(() => {
    if (!activeMaterialId) return;
    setLoadingQuestions(true);
    fetchQuestions(activeMaterialId)
      .then(setQuestions)
      .catch(err => {
        console.error('Failed to fetch questions:', err);
        setLoadingQuestions(false);
      });
  }, [activeMaterialId, setQuestions, setLoadingQuestions]);

  // Restore document blocks if activeMaterialId exists from localStorage but blocks are empty
  const documentBlocks = useStore(state => state.documentBlocks);
  useEffect(() => {
    if (activeMaterialId && documentBlocks.length === 0) {
      setLoadingDocument(true);
      fetchMaterialDetail(activeMaterialId)
        .then(detail => { setDocumentBlocks(detail.blocks as any); })
        .catch(err => {
          console.error('Failed to restore document:', err);
          // If the document fails to load (e.g. 404), it was likely deleted. Clear it from the state.
          setActiveMaterial(null as any, '');
          setDocumentBlocks([]);
        })
        .finally(() => setLoadingDocument(false));
    }
  }, [activeMaterialId, documentBlocks.length, setDocumentBlocks, setLoadingDocument, setActiveMaterial]);

  const handleSelectMaterial = async (id: string, title: string) => {
    if (activeMaterialId === id) return;
    setActiveMaterial(id, title);
    setLoadingDocument(true);
    setDocumentBlocks([]);
    setIsLeftSidebarOpen(false); // auto-close on mobile after selecting
    try {
      const detail = await fetchMaterialDetail(id);
      setDocumentBlocks(detail.blocks as any);
    } catch (err) {
      console.error('Failed to load document:', err);
    } finally {
      setLoadingDocument(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle.trim()) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const result = await uploadMaterial(uploadTitle.trim(), uploadFile);
      addMaterial({ id: result.id, title: result.title, status: 'ready', created_at: new Date().toISOString() });
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

  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRenameMaterial = async (id: string, newTitle: string) => {
    try {
      await renameMaterial(id, newTitle);
      setMaterials(materials.map(m => m.id === id ? { ...m, title: newTitle } : m));
      if (activeMaterialId === id) {
        setActiveMaterial(id, newTitle);
      }
    } catch (err) {
      alert("Failed to rename material");
    }
  };

  const confirmDelete = async () => {
    if (!materialToDelete) return;
    setIsDeleting(true);
    try {
      await deleteMaterial(materialToDelete.id);
      setMaterials(materials.filter(m => m.id !== materialToDelete.id));
      if (activeMaterialId === materialToDelete.id) {
        setActiveMaterial(null as any, '');
        setDocumentBlocks([]);
      }
      setMaterialToDelete(null);
    } catch (err) {
      alert("Failed to delete material");
    } finally {
      setIsDeleting(false);
    }
  };

  const pendingCount = pendingQuestions.filter(q => q.status === 'pending' || q.status === 'failed').length;

  return (
    <div className="select-none flex min-h-[100dvh] md:h-[100dvh] bg-background font-body-md text-on-surface md:overflow-hidden">

      {/* ── Left Sidebar Overlay (mobile) / Panel (desktop) ─────────────── */}
      {/* Backdrop */}
      {isLeftSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setIsLeftSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed md:relative inset-y-0 left-0 z-50
        bg-surface-container-low border-r border-outline-variant
        flex flex-col shrink-0 transition-transform duration-300
        w-72
        ${isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${!isLeftSidebarOpen ? 'md:w-0 md:overflow-hidden md:border-r-0' : 'md:w-72'}
      `}>
        <div className="w-72 flex flex-col h-full">
          <div className="p-md flex items-center justify-between gap-sm border-b border-outline-variant h-16 shrink-0">
            <span className="font-headline-md text-on-surface tracking-tight font-bold">Hippocrates AI</span>
            <button onClick={() => setIsLeftSidebarOpen(false)} className="p-xs text-on-surface-variant hover:bg-surface-container-high rounded transition-colors" title="Close Library">
              <X size={20} />
            </button>
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
                <MaterialNavItem
                  key={material.id}
                  material={material}
                  isActive={activeMaterialId === material.id}
                  onSelect={() => handleSelectMaterial(material.id, material.title)}
                  onRename={handleRenameMaterial}
                  onDelete={async () => setMaterialToDelete(material)}
                />
              ))}
            </nav>
          </div>

          <div className="p-md border-t border-outline-variant shrink-0">
            <button
              onClick={() => setShowUpload(true)}
              className="w-full flex items-center justify-center gap-sm bg-primary text-on-primary py-sm rounded-lg font-label-md hover:bg-primary-container transition-all"
            >
              <Plus size={18} />
              Add New Material
            </button>
          </div>

          <div className="p-md border-t border-outline-variant shrink-0">
            <a href="#" className="flex items-center gap-sm text-on-surface-variant hover:text-on-surface transition-colors">
              <Settings size={18} />
              <span className="text-label-md">Fine-tune AI prompt</span>
            </a>
          </div>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface">

        {/* Header */}
        <header className="sticky top-0 h-14 md:h-16 flex items-center justify-between px-md md:px-xl bg-surface/80 backdrop-blur-xl z-40 border-b border-outline-variant shrink-0 gap-sm">
          <div className="flex items-center gap-sm">
            {/* Hamburger — always visible */}
            <button
              onClick={() => setIsLeftSidebarOpen(v => !v)}
              className="p-xs hover:bg-surface-container-high rounded text-on-surface-variant hover:text-on-surface transition-colors"
              title="Library"
            >
              <Menu size={20} />
            </button>

            {/* Read / Review toggle */}
            <div className="flex items-center bg-surface-container-lowest p-[3px] rounded-full border border-outline-variant">
              <button
                onClick={() => setMode('read')}
                className={`px-md py-[3px] rounded-full text-label-sm md:text-label-md transition-colors ${mode === 'read' ? 'bg-surface-container text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
              >Read</button>
              <button
                onClick={() => setMode('review')}
                className={`px-md py-[3px] rounded-full text-label-sm md:text-label-md transition-colors ${mode === 'review' ? 'bg-surface-container text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
              >Review</button>
            </div>
          </div>

          <div className="flex items-center gap-sm md:gap-md">
            {/* Review Queue button */}
            {mode === 'read' ? (
              <button
                onClick={() => setIsRightSidebarOpen(v => !v)}
                className="relative p-xs hover:bg-surface-container-high rounded text-on-surface-variant hover:text-on-surface transition-colors"
                title="Review Queue"
              >
                <ClipboardList size={20} />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-on-primary text-[9px] font-bold flex items-center justify-center">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={() => setIsDocDrawerOpen(v => !v)}
                className="relative p-xs hover:bg-surface-container-high rounded text-on-surface-variant hover:text-on-surface transition-colors"
                title="View Source Material"
              >
                <Book size={20} />
              </button>
            )}

            {/* User avatar */}
            <div className="relative">
              <div
                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer font-bold text-on-primary select-none text-sm"
                onClick={() => document.getElementById('user-dropdown')?.classList.toggle('hidden')}
              >
                {currentUser?.first_name?.[0]?.toUpperCase() || <User size={16} />}
              </div>
              <div id="user-dropdown" className="hidden absolute right-0 mt-2 w-48 bg-surface border border-outline-variant rounded-xl shadow-lg py-sm z-50">
                <div className="px-md py-sm border-b border-outline-variant mb-xs">
                  <p className="text-label-md text-on-surface truncate font-bold">{currentUser?.first_name} {currentUser?.last_name}</p>
                  <p className="text-label-sm text-on-surface-variant truncate">{currentUser?.email}</p>
                </div>
                <button
                  onClick={() => {
                    const refresh = localStorage.getItem('refresh_token');
                    if (refresh) logoutApi(refresh).catch(() => {});
                    logout();
                    window.location.href = '/login';
                  }}
                  className="w-full text-left px-md py-sm text-label-md text-error hover:bg-error/10 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 flex min-h-0 relative md:overflow-hidden">
          {mode === 'read' ? (
            <>
              <DocumentRenderer />

              {/* Right Panel backdrop (mobile) */}
              {isRightSidebarOpen && (
                <div
                  className="fixed inset-0 bg-black/40 z-40 md:hidden"
                  onClick={() => setIsRightSidebarOpen(false)}
                />
              )}

              {/* Right Panel: AI Review Queue */}
              <aside className={`
                fixed md:relative inset-y-0 right-0 z-50
                bg-surface-container flex flex-col shrink-0 min-h-0 border-l border-outline-variant
                transition-all duration-300
                w-[85vw]
                ${isRightSidebarOpen ? 'translate-x-0 md:w-96' : 'translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden md:border-l-0'}
              `}>
                <div className="w-[85vw] md:w-96 flex flex-col h-full min-h-0">
                  <header className="h-14 md:h-16 flex items-center justify-between px-md border-b border-outline-variant bg-surface-container-high shrink-0">
                    <div className="flex items-center gap-sm">
                      <button onClick={() => setIsRightSidebarOpen(false)} className="p-xs text-on-surface-variant hover:bg-surface-container-highest rounded transition-colors" title="Close">
                        <X size={20} />
                      </button>
                      <div className="font-headline-md text-on-surface text-[15px] md:text-[16px]">Review Queue</div>
                    </div>
                    <div className="bg-surface-container-lowest px-sm py-xs rounded border border-outline-variant flex items-center gap-xs">
                      <span className="text-label-sm text-on-surface-variant">Pending:</span>
                      <span className="text-label-sm font-bold text-primary">{queueCount} / {MAX_QUEUE}</span>
                      {activeRequestCount > 0 && (
                        <>
                          <div className="w-px h-3 bg-outline-variant mx-[2px]"></div>
                          <div className="flex items-center gap-[4px] text-primary bg-primary/10 px-2 py-[2px] rounded-full">
                            <Loader2 size={12} className="animate-spin" />
                            <span className="text-[11px] font-bold tracking-wide uppercase">{activeRequestCount} generating</span>
                          </div>
                        </>
                      )}
                    </div>
                  </header>
                  <div className="flex-1 overflow-y-auto p-md flex flex-col gap-md">
                    {pendingQuestions.filter(q => q.status === 'pending' || q.status === 'failed').map((question) => (
                      <QuestionCard key={question.id} question={question} />
                    ))}
                    {pendingCount === 0 && (
                      <div className="flex flex-col items-center justify-center py-xl text-on-surface-variant text-center opacity-50">
                        <p>No pending questions.</p>
                        <p className="text-label-sm mt-xs">Highlight text in the document to generate questions.</p>
                      </div>
                    )}
                  </div>
                </div>
              </aside>
            </>
          ) : (
            <>
              {/* Review Mode — full width on mobile */}
              <ReviewMode />
              
              {/* Doc sidebar drawer on mobile in review mode */}
              {isDocDrawerOpen && (
                <div
                  className="fixed inset-0 bg-black/40 z-40 md:hidden"
                  onClick={() => setIsDocDrawerOpen(false)}
                />
              )}
              <aside className={`
                fixed md:relative inset-y-0 right-0 z-50
                bg-surface-container-lowest flex flex-col shrink-0 border-l border-outline-variant
                transition-transform duration-300
                w-[85vw] md:w-96
                ${isDocDrawerOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
              `}>
                <div className="w-[85vw] md:w-96 flex flex-col h-full">
                  <header className="h-14 md:hidden flex items-center justify-between px-md border-b border-outline-variant bg-surface-container-high shrink-0">
                    <div className="font-headline-md text-on-surface">Source Material</div>
                    <button onClick={() => setIsDocDrawerOpen(false)} className="p-xs text-on-surface-variant hover:bg-surface-container-highest rounded">
                      <X size={20} />
                    </button>
                  </header>
                  <div className="flex-1 overflow-y-auto relative">
                    <DocumentRenderer readOnly scrollToBlockId={activeBlockId} isDrawerOpen={isDocDrawerOpen} />
                  </div>
                </div>
              </aside>
            </>
          )}
        </main>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-md">
          <div className="bg-surface-container rounded-t-2xl sm:rounded-2xl p-xl w-full sm:max-w-md shadow-2xl">
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
                  <span className="text-label-md text-on-surface-variant text-center truncate w-full px-sm">
                    {uploadFile ? uploadFile.name : 'Tap to select a .docx file'}
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0] || null;
                    setUploadFile(file);
                    if (file && !uploadTitle.trim()) {
                      setUploadTitle(file.name.replace(/\.docx?$/i, ''));
                    }
                  }}
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

      {/* Global Delete Confirm Modal */}
      {materialToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-md bg-black/40 backdrop-blur-sm transition-opacity duration-200">
          <div className="bg-surface rounded-2xl shadow-2xl border border-outline-variant w-full max-w-sm overflow-hidden transform transition-all duration-200">
            <div className="p-xl text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center mb-md">
                <Trash2 size={24} />
              </div>
              <h3 className="text-title-lg font-bold text-on-surface mb-sm">Delete Material?</h3>
              <p className="text-body-md text-on-surface-variant w-full whitespace-normal break-words">
                Are you sure you want to delete <span className="font-bold text-on-surface break-all">"{materialToDelete.title}"</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex bg-surface-container-low p-md gap-sm">
              <button
                onClick={() => setMaterialToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-sm rounded-full text-label-md font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-sm rounded-full text-label-md font-bold bg-error text-on-error hover:bg-error/90 shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-xs"
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
