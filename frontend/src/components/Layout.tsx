import React, { useEffect, useRef, useState } from 'react';
import { DocumentRenderer } from './DocumentRenderer';
import { QuestionCard } from './QuestionCard';
import { ReviewMode } from './ReviewMode';
import { useStore } from '../store/useStore';
import { Book, Settings, Plus, User, Upload, Loader2, X, Menu, ClipboardList } from 'lucide-react';
import { fetchMaterials, fetchMaterialDetail, uploadMaterial, fetchQuestions, logout as logoutApi } from '../api';

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
        .catch(err => console.error('Failed to restore document:', err))
        .finally(() => setLoadingDocument(false));
    }
  }, [activeMaterialId, documentBlocks.length, setDocumentBlocks, setLoadingDocument]);

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

  const pendingCount = pendingQuestions.filter(q => q.status === 'pending' || q.status === 'failed').length;

  return (
    <div className="flex h-[100dvh] bg-background font-body-md text-on-surface overflow-hidden">

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
        <header className="h-14 md:h-16 flex items-center justify-between px-md md:px-xl bg-surface/80 backdrop-blur-xl z-40 border-b border-outline-variant shrink-0 gap-sm">
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
            {/* Review Queue button — mobile only in read mode */}
            {mode === 'read' && (
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
        <main className="flex-1 flex min-h-0 relative overflow-hidden">
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
              {/* Doc sidebar hidden on mobile in review mode */}
              <aside className="hidden md:block w-96 shrink-0 border-l border-outline-variant overflow-y-auto bg-surface-container-lowest">
                <DocumentRenderer readOnly scrollToBlockId={activeBlockId} />
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
                  <span className="text-label-md text-on-surface-variant text-center">
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
    </div>
  );
};
