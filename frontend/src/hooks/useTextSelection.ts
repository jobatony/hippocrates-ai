import { useState, useEffect } from 'react';

interface SelectionState {
  blockId: string | null;
  text: string;
  startOffset: number;
  endOffset: number;
  rect: DOMRect | null;
}

export const useTextSelection = () => {
  const [selection, setSelection] = useState<SelectionState | null>(null);

  useEffect(() => {
    const handleMouseUp = () => {
      const domSelection = window.getSelection();
      if (!domSelection || domSelection.isCollapsed) {
        setSelection(null);
        return;
      }

      const range = domSelection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      
      // Traverse up to find the block element
      let blockElement: HTMLElement | null = null;
      let current: Node | null = container;
      
      while (current && current !== document.body) {
        if (current.nodeType === Node.ELEMENT_NODE) {
          const el = current as HTMLElement;
          if (el.hasAttribute('data-block-id')) {
            blockElement = el;
            break;
          }
        }
        current = current.parentNode;
      }

      if (blockElement) {
        const blockId = blockElement.getAttribute('data-block-id');
        const rect = range.getBoundingClientRect();
        
        // This is a simplified offset calculation. 
        // A robust implementation would need to handle nested nodes correctly.
        const startOffset = range.startOffset;
        const endOffset = range.endOffset;
        const text = domSelection.toString();

        setSelection({
          blockId,
          text,
          startOffset,
          endOffset,
          rect
        });
      } else {
        setSelection(null);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    
    // Clear selection when mouse down outside
    const handleMouseDown = (e: MouseEvent) => {
        // If clicking on FAB, don't clear
        const target = e.target as HTMLElement;
        if (target.closest('.fab-container')) return;
        
        const domSelection = window.getSelection();
        if (domSelection) {
            // domSelection.removeAllRanges(); // let native selection handle itself, we just hide FAB
            // setSelection(null); 
        }
    }
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  const clearSelection = () => {
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  return { selection, clearSelection };
};
