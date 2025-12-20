import { useCallback, useRef } from 'react';

interface UseDragOptions {
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function useDrag(
  onDrag: (delta: { x: number; y: number }) => void,
  options: UseDragOptions = {}
) {
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);
  const onDragRef = useRef(onDrag);
  const optionsRef = useRef(options);

  // Keep refs updated
  onDragRef.current = onDrag;
  optionsRef.current = options;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only allow left mouse button
    if (e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    isDragging.current = true;
    startPos.current = { x: e.clientX, y: e.clientY };
    optionsRef.current.onDragStart?.();

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      // Cancel any pending animation frame
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }

      // Use requestAnimationFrame for smooth updates
      rafId.current = requestAnimationFrame(() => {
        const deltaX = e.clientX - startPos.current.x;
        const deltaY = e.clientY - startPos.current.y;

        startPos.current = { x: e.clientX, y: e.clientY };
        onDragRef.current({ x: deltaX, y: deltaY });
      });
    };

    const handleMouseUp = () => {
      isDragging.current = false;

      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }

      optionsRef.current.onDragEnd?.();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;

    e.stopPropagation();

    isDragging.current = true;
    const touch = e.touches[0];
    startPos.current = { x: touch.clientX, y: touch.clientY };
    optionsRef.current.onDragStart?.();

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || e.touches.length !== 1) return;

      e.preventDefault();

      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }

      rafId.current = requestAnimationFrame(() => {
        const touch = e.touches[0];
        const deltaX = touch.clientX - startPos.current.x;
        const deltaY = touch.clientY - startPos.current.y;

        startPos.current = { x: touch.clientX, y: touch.clientY };
        onDragRef.current({ x: deltaX, y: deltaY });
      });
    };

    const handleTouchEnd = () => {
      isDragging.current = false;

      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }

      optionsRef.current.onDragEnd?.();
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  }, []);

  return {
    onMouseDown: handleMouseDown,
    onTouchStart: handleTouchStart,
  };
}
