import React, { useEffect, useRef } from 'react';
import { useDocumentTree, useStore } from '../store/useStore';
import { BlockNode } from './BlockNode';
import { useTextSelection } from '../hooks/useTextSelection';
import { useQuestionGeneration } from '../hooks/useQuestionGeneration';
import { CheckSquare, Radio, Space, Loader2, FileText, ListChecks } from 'lucide-react';

interface Props {
  readOnly?: boolean;
  scrollToBlockId?: string | null;
  isDrawerOpen?: boolean;
}

export const DocumentRenderer: React.FC<Props> = ({ readOnly = false, scrollToBlockId = null, isDrawerOpen = false }) => {
  const tree = useDocumentTree();
  const { selection, clearSelection } = useTextSelection();
  const queueCount = useStore(state => state.queueCount);
  const activeMaterialId = useStore(state => state.activeMaterialId);
  const activeMaterialTitle = useStore(state => state.activeMaterialTitle);
  const isLoadingDocument = useStore(state => state.isLoadingDocument);

  const { generateQuestion } = useQuestionGeneration(activeMaterialId || '');
  const activeRequestCount = useStore(state => state.activeRequestCount);
  const MAX_CONCURRENT = 7;
  const MAX_QUEUE = 20;
  const isBlocked = activeRequestCount >= MAX_CONCURRENT || (queueCount + activeRequestCount) >= MAX_QUEUE;

  useEffect(() => {
    if (scrollToBlockId && tree.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(`block-${scrollToBlockId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('bg-primary/10', 'transition-colors', 'duration-1000');
          setTimeout(() => {
            el.classList.remove('bg-primary/10');
          }, 2000);
        }
      }, 350); // wait for drawer transition (300ms) to complete before calculating scroll position
    }
  }, [scrollToBlockId, tree.length, isDrawerOpen]);

  const setScrollProgress = useStore(state => state.setScrollProgress);
  const scrollProgress = useStore(state => state.scrollProgress);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      let currentProgress = 0;
      
      // Desktop (container scroll)
      if (window.innerWidth >= 768 && containerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        if (scrollHeight > clientHeight) {
          currentProgress = (scrollTop / (scrollHeight - clientHeight)) * 100;
        }
      } 
      // Mobile (window scroll)
      else {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;
        if (scrollHeight > clientHeight) {
          currentProgress = (scrollTop / (scrollHeight - clientHeight)) * 100;
        }
      }
      
      setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    // Initial calculate after render
    setTimeout(handleScroll, 100);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [tree.length]);

  const handleGenerate = (type: 'true_false' | 'mcq' | 'fill_in' | 'applies') => {
    if (selection && selection.blockId) {
      generateQuestion(selection.blockId, selection.text, type);
      clearSelection();
    }
  };

  // Suppress native context menu when there is an active text selection
  // so it doesn't race/conflict with our FAB on mobile
  const handleContextMenu = (e: React.MouseEvent) => {
    if (selection && selection.text) {
      e.preventDefault();
    }
  };

  // Empty state
  if (!activeMaterialId && !isLoadingDocument) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-w-0 bg-surface text-on-surface-variant px-lg text-center">
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
    <div className="flex-1 flex flex-col min-w-0 bg-surface relative md:h-full">
      {/* Read Progress Bar */}
      <div className="sticky top-14 md:absolute md:top-0 left-0 right-0 z-30 bg-surface/90 backdrop-blur-xl px-md sm:px-xl py-2 border-b border-outline-variant transition-all">
        <div className="max-w-3xl mx-auto flex items-center gap-sm">
          <div className="flex-1 bg-surface-container-high rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-primary h-1.5 rounded-full transition-all duration-150 ease-out" 
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
          <div className="text-[11px] text-on-surface-variant font-bold font-mono w-8 text-right">
            {Math.round(scrollProgress)}%
          </div>
        </div>
      </div>

      {/* Scrolling Content */}
      <div
        ref={containerRef}
        className="flex-1 flex flex-col min-w-0 px-md sm:px-xl pt-6 pb-xl md:pt-16 md:overflow-y-auto relative"
        onContextMenu={handleContextMenu}
      >
        <div className="max-w-3xl mx-auto w-full relative">
        <header className="mb-xl">
          <h1 className="font-display-lg text-on-surface mb-sm text-[clamp(1.4rem,4vw,2.2rem)] leading-tight line-clamp-3 break-words hyphens-auto" lang="en">{activeMaterialTitle}</h1>
          <div className="flex items-center gap-md text-label-md text-on-surface-variant">
            <span>{tree.length} sections</span>
          </div>
        </header>

        <div className="space-y-sm">
          {tree.map((block: any) => (
            <BlockNode key={block.id} block={block} />
          ))}
        </div>

        {/* ── Desktop Floating Action Tooltip ── */}
        {!readOnly && selection && selection.rect && (
          <div
            className="hidden md:block fab-container fixed z-50 transform -translate-x-1/2 -translate-y-full pb-4"
            style={{
              top: selection.rect.top + window.scrollY,
              left: Math.min(
                Math.max(selection.rect.left + selection.rect.width / 2, 80),
                window.innerWidth - 80
              ),
            }}
          >
            <div className="bg-surface-container-highest shadow-xl rounded-xl p-xs flex items-center gap-xs">
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-surface-container-highest"></div>
              {isBlocked ? (
                <div className="px-md py-sm text-error font-label-sm whitespace-nowrap text-sm">
                  {activeRequestCount >= MAX_CONCURRENT
                    ? `${activeRequestCount} in progress. Wait.`
                    : 'Review pending questions first.'}
                </div>
              ) : (
                <>
                  <button onPointerDown={(e) => { e.preventDefault(); handleGenerate('true_false'); }} className="px-sm py-sm bg-surface-container hover:bg-surface-container-low text-on-surface rounded-lg font-label-sm whitespace-nowrap flex items-center gap-xs transition-colors text-sm">
                    <CheckSquare size={16} /> T/F
                  </button>
                  <button onPointerDown={(e) => { e.preventDefault(); handleGenerate('mcq'); }} className="px-sm py-sm bg-surface-container hover:bg-surface-container-low text-on-surface rounded-lg font-label-sm whitespace-nowrap flex items-center gap-xs transition-colors text-sm">
                    <Radio size={16} /> MCQ
                  </button>
                  <button onPointerDown={(e) => { e.preventDefault(); handleGenerate('fill_in'); }} className="px-sm py-sm bg-surface-container hover:bg-surface-container-low text-on-surface rounded-lg font-label-sm whitespace-nowrap flex items-center gap-xs transition-colors text-sm">
                    <Space size={16} /> Fill-in
                  </button>
                  <button onPointerDown={(e) => { e.preventDefault(); handleGenerate('applies'); }} className="px-sm py-sm bg-surface-container hover:bg-surface-container-low text-on-surface rounded-lg font-label-sm whitespace-nowrap flex items-center gap-xs transition-colors text-sm">
                    <ListChecks size={16} /> Applies
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Mobile Fixed Bottom Action Bar ── */}
        {!readOnly && selection && (
          <div className="md:hidden fab-container fixed bottom-4 left-4 right-4 z-50">
            <div className="bg-surface-container-highest shadow-2xl rounded-2xl p-sm flex flex-col gap-sm border border-outline-variant">
              <div className="text-label-xs text-on-surface-variant font-bold uppercase tracking-wider text-center border-b border-outline-variant pb-xs">
                Generate Question
              </div>
              {isBlocked ? (
                <div className="px-sm py-sm text-error font-label-sm text-center text-sm">
                  {activeRequestCount >= MAX_CONCURRENT
                    ? `${activeRequestCount} in progress. Wait.`
                    : 'Review pending questions first.'}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-sm">
                  <button onPointerDown={(e) => { e.preventDefault(); handleGenerate('true_false'); }} className="py-md bg-surface hover:bg-surface-container-low text-on-surface rounded-xl font-label-md flex justify-center items-center gap-sm transition-colors shadow-sm">
                    <CheckSquare size={18} /> T/F
                  </button>
                  <button onPointerDown={(e) => { e.preventDefault(); handleGenerate('mcq'); }} className="py-md bg-surface hover:bg-surface-container-low text-on-surface rounded-xl font-label-md flex justify-center items-center gap-sm transition-colors shadow-sm">
                    <Radio size={18} /> MCQ
                  </button>
                  <button onPointerDown={(e) => { e.preventDefault(); handleGenerate('fill_in'); }} className="py-md bg-surface hover:bg-surface-container-low text-on-surface rounded-xl font-label-md flex justify-center items-center gap-sm transition-colors shadow-sm">
                    <Space size={18} /> Fill-in
                  </button>
                  <button onPointerDown={(e) => { e.preventDefault(); handleGenerate('applies'); }} className="py-md bg-surface hover:bg-surface-container-low text-on-surface rounded-xl font-label-md flex justify-center items-center gap-sm transition-colors shadow-sm">
                    <ListChecks size={18} /> Applies
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};
