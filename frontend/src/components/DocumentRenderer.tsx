import React from 'react';
import { useDocumentTree } from '../store/useStore';
import { BlockNode } from './BlockNode';
import { useTextSelection } from '../hooks/useTextSelection';
import { useQuestionWebSocket } from '../hooks/useQuestionWebSocket';
import { useStore } from '../store/useStore';
import { CheckSquare, Radio, Space } from 'lucide-react';

export const DocumentRenderer: React.FC = () => {
  const tree = useDocumentTree();
  const { selection, clearSelection } = useTextSelection();
  const { generateQuestion } = useQuestionWebSocket('doc_1');
  const queueCount = useStore(state => state.queueCount);
  const MAX_QUEUE = 20;
  
  const isQueueFull = queueCount >= MAX_QUEUE;

  const handleGenerate = (type: 'true_false' | 'mcq' | 'fill_in') => {
    if (selection && selection.blockId) {
      generateQuestion(selection.blockId, selection.text, type);
      clearSelection();
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-surface p-xl overflow-y-auto relative h-full">
      <div className="max-w-3xl mx-auto w-full relative">
        <header className="mb-xl">
          <h1 className="font-display-lg text-on-surface mb-sm">Diabetes Mellitus Type 2</h1>
          <div className="flex items-center gap-md text-label-md text-on-surface-variant">
            <span className="flex items-center gap-xs">Diabetes Mellitus</span>
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
                  <button 
                    onClick={() => handleGenerate('true_false')}
                    className="px-md py-sm bg-surface-container hover:bg-surface-container-low text-on-surface rounded-lg font-label-sm whitespace-nowrap flex items-center gap-xs transition-colors"
                  >
                    <CheckSquare size={16} /> T/F
                  </button>
                  <button 
                    onClick={() => handleGenerate('mcq')}
                    className="px-md py-sm bg-surface-container hover:bg-surface-container-low text-on-surface rounded-lg font-label-sm whitespace-nowrap flex items-center gap-xs transition-colors"
                  >
                    <Radio size={16} /> MCQ
                  </button>
                  <button 
                    onClick={() => handleGenerate('fill_in')}
                    className="px-md py-sm bg-surface-container hover:bg-surface-container-low text-on-surface rounded-lg font-label-sm whitespace-nowrap flex items-center gap-xs transition-colors"
                  >
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
