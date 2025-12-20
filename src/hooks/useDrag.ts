import { useCallback, useRef } from 'react';

interface UseDragOptions {
  onDragStart?: () => void;
  onDragEnd?: () => void;
  bounds?: { left: number; top: number; right: number; bottom: number };
}

export function useDrag(
  onDrag: (delta: { x: number; y: number }) => void,
  options: UseDragOptions = {}
) {
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      startPos.current = { x: e.clientX, y: e.clientY };
      options.onDragStart?.();

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current) return;
        
        const deltaX = e.clientX - startPos.current.x;
        const deltaY = e.clientY - startPos.current.y;
        
        startPos.current = { x: e.clientX, y: e.clientY };
        onDrag({ x: deltaX, y: deltaY });
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        options.onDragEnd?.();
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [onDrag, options]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return;
      
      isDragging.current = true;
      const touch = e.touches[0];
      startPos.current = { x: touch.clientX, y: touch.clientY };
      options.onDragStart?.();

      const handleTouchMove = (e: TouchEvent) => {
        if (!isDragging.current || e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - startPos.current.x;
        const deltaY = touch.clientY - startPos.current.y;
        
        startPos.current = { x: touch.clientX, y: touch.clientY };
        onDrag({ x: deltaX, y: deltaY });
      };

      const handleTouchEnd = () => {
        isDragging.current = false;
        options.onDragEnd?.();
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };

      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    },
    [onDrag, options]
  );

  return {
    onMouseDown: handleMouseDown,
    onTouchStart: handleTouchStart,
  };
}
