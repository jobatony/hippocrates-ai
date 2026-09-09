import { useState, useEffect, useRef } from 'react';

interface SelectionState {
  blockId: string | null;
  text: string;
  startOffset: number;
  endOffset: number;
  rect: DOMRect | null;
}

export const useTextSelection = () => {
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const readSelection = () => {
      const domSelection = window.getSelection();
      if (!domSelection || domSelection.isCollapsed) {
        setSelection(null);
        return;
      }

      const range = domSelection.getRangeAt(0);
      const container = range.commonAncestorContainer;

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
        const startOffset = range.startOffset;
        const endOffset = range.endOffset;
        const text = domSelection.toString().trim();

        if (text.length > 0) {
          setSelection({ blockId, text, startOffset, endOffset, rect });
        } else {
          setSelection(null);
        }
      } else {
        setSelection(null);
      }
    };

    // ── Desktop: mouseup ──────────────────────────────────────────────
    const handleMouseUp = () => {
      setTimeout(readSelection, 10);
    };

    // ── Mobile: touchstart / touchend for long-press detection ────────
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartPos.current = { x: touch.clientX, y: touch.clientY };

      // Clear any previous selection state when starting a new touch
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };

    const handleTouchEnd = () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      // Give the browser a moment to finalise the selection before we read it
      setTimeout(readSelection, 300);
    };

    const handleTouchMove = (e: TouchEvent) => {
      // If the finger moved significantly, it's a scroll not a selection — cancel
      if (!touchStartPos.current) return;
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - touchStartPos.current.x);
      const dy = Math.abs(touch.clientY - touchStartPos.current.y);
      if (dx > 10 || dy > 10) {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
      }
    };

    // ── Clear on mousedown outside FAB ────────────────────────────────
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.fab-container')) return;
      setSelection(null);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  const clearSelection = () => {
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  return { selection, clearSelection };
};

