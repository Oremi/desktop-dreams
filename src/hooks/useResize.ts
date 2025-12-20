import { useCallback, useRef, useState } from 'react';

type ResizeDirection = 
  | 'n' | 's' | 'e' | 'w' 
  | 'ne' | 'nw' | 'se' | 'sw';

interface UseResizeOptions {
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
}

export function useResize(
  onResize: (
    delta: { width: number; height: number },
    positionDelta: { x: number; y: number }
  ) => void,
  options: UseResizeOptions = {}
) {
  const {
    minWidth = 400,
    minHeight = 300,
    maxWidth = Infinity,
    maxHeight = Infinity,
  } = options;

  const [isResizing, setIsResizing] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const currentDirection = useRef<ResizeDirection | null>(null);

  const handleResizeStart = useCallback(
    (direction: ResizeDirection) => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      setIsResizing(true);
      currentDirection.current = direction;
      startPos.current = { x: e.clientX, y: e.clientY };
      options.onResizeStart?.();

      const handleMouseMove = (e: MouseEvent) => {
        const dir = currentDirection.current;
        if (!dir) return;

        const deltaX = e.clientX - startPos.current.x;
        const deltaY = e.clientY - startPos.current.y;
        startPos.current = { x: e.clientX, y: e.clientY };

        let widthDelta = 0;
        let heightDelta = 0;
        let posX = 0;
        let posY = 0;

        // Handle horizontal resizing
        if (dir.includes('e')) {
          widthDelta = deltaX;
        } else if (dir.includes('w')) {
          widthDelta = -deltaX;
          posX = deltaX;
        }

        // Handle vertical resizing
        if (dir.includes('s')) {
          heightDelta = deltaY;
        } else if (dir.includes('n')) {
          heightDelta = -deltaY;
          posY = deltaY;
        }

        onResize(
          { width: widthDelta, height: heightDelta },
          { x: posX, y: posY }
        );
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        currentDirection.current = null;
        options.onResizeEnd?.();
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [onResize, options]
  );

  const resizeHandlers = {
    n: handleResizeStart('n'),
    s: handleResizeStart('s'),
    e: handleResizeStart('e'),
    w: handleResizeStart('w'),
    ne: handleResizeStart('ne'),
    nw: handleResizeStart('nw'),
    se: handleResizeStart('se'),
    sw: handleResizeStart('sw'),
  };

  return { resizeHandlers, isResizing };
}
