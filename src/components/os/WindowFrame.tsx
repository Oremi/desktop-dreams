import React, { useCallback, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Minus, Square, X, Maximize2 } from 'lucide-react';
import { WindowState } from '@/types/os';
import { useWindowContext } from '@/contexts/WindowContext';
import { useDrag } from '@/hooks/useDrag';
import { useResize } from '@/hooks/useResize';
import { cn } from '@/lib/utils';

interface WindowFrameProps {
  window: WindowState;
  children: React.ReactNode;
  className?: string;
  isTablet?: boolean;
}

export const WindowFrame = forwardRef<HTMLDivElement, WindowFrameProps>(
  function WindowFrame({ window, children, className, isTablet }, ref) {
  const {
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    focusWindow,
    updateWindowPosition,
    updateWindowSize,
    activeWindowId,
  } = useWindowContext();

  const isActive = activeWindowId === window.id;

  const handleDrag = useCallback(
    (delta: { x: number; y: number }) => {
      if (window.isMaximized) return;
      updateWindowPosition(window.id, (current) => ({
        x: current.x + delta.x,
        y: current.y + delta.y,
      }));
    },
    [window.id, window.isMaximized, updateWindowPosition]
  );

  const handleResize = useCallback(
    (sizeDelta: { width: number; height: number }, posDelta: { x: number; y: number }) => {
      if (window.isMaximized) return;
      
      const minWidth = isTablet ? 300 : 400;
      const maxWidth = isTablet ? 700 : 1600;
      const minHeight = isTablet ? 250 : 300;
      const maxHeight = isTablet ? 600 : 1000;
      
      updateWindowSize(window.id, (currentSize) => ({
        width: Math.max(minWidth, Math.min(maxWidth, currentSize.width + sizeDelta.width)),
        height: Math.max(minHeight, Math.min(maxHeight, currentSize.height + sizeDelta.height)),
      }));
      
      if (posDelta.x !== 0 || posDelta.y !== 0) {
        updateWindowPosition(window.id, (currentPos) => ({
          x: currentPos.x + posDelta.x,
          y: currentPos.y + posDelta.y,
        }));
      }
    },
    [window.id, window.isMaximized, isTablet, updateWindowSize, updateWindowPosition]
  );

  const dragHandlers = useDrag(handleDrag);
  const { resizeHandlers } = useResize(handleResize);

  const handleDoubleClick = () => {
    maximizeWindow(window.id);
  };

  if (window.isMinimized) return null;

  const windowStyle = window.isMaximized
    ? { left: 0, top: 0, width: '100%', height: 'calc(100% - 48px)' }
    : {
        left: window.position.x,
        top: window.position.y,
        width: window.size.width,
        height: window.size.height,
      };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={cn(
        'absolute flex flex-col overflow-hidden window-shadow gpu-accelerate',
        !window.isMaximized && 'rounded-xl border border-window-border',
        'bg-window/95 backdrop-blur-xl',
        isActive ? 'ring-1 ring-primary/20' : '',
        className
      )}
      style={{
        ...windowStyle,
        zIndex: window.zIndex,
      }}
      onMouseDown={() => focusWindow(window.id)}
    >
      {/* Title Bar */}
      <div
        className={cn(
          'flex items-center justify-between h-10 px-3 select-none',
          'bg-window-header border-b border-window-border',
          'cursor-grab active:cursor-grabbing'
        )}
        onDoubleClick={handleDoubleClick}
        {...dragHandlers}
      >
        {/* Icon and Title */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">{window.icon}</span>
          <span className="text-sm font-medium text-window-foreground truncate">
            {window.title}
          </span>
        </div>

        {/* Window Controls */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              minimizeWindow(window.id);
            }}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <Minus className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              maximizeWindow(window.id);
            }}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            {window.isMaximized ? (
              <Square className="w-3 h-3 text-muted-foreground" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeWindow(window.id);
            }}
            className="p-1.5 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-window text-window-foreground">
        {children}
      </div>

      {/* Resize Handles - Only when not maximized */}
      {!window.isMaximized && (
        <>
          {/* Edge handles */}
          <div
            className="absolute top-0 left-2 right-2 h-1 cursor-n-resize"
            onMouseDown={resizeHandlers.n}
          />
          <div
            className="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize"
            onMouseDown={resizeHandlers.s}
          />
          <div
            className="absolute left-0 top-2 bottom-2 w-1 cursor-w-resize"
            onMouseDown={resizeHandlers.w}
          />
          <div
            className="absolute right-0 top-2 bottom-2 w-1 cursor-e-resize"
            onMouseDown={resizeHandlers.e}
          />
          {/* Corner handles */}
          <div
            className="absolute top-0 left-0 w-2 h-2 cursor-nw-resize"
            onMouseDown={resizeHandlers.nw}
          />
          <div
            className="absolute top-0 right-0 w-2 h-2 cursor-ne-resize"
            onMouseDown={resizeHandlers.ne}
          />
          <div
            className="absolute bottom-0 left-0 w-2 h-2 cursor-sw-resize"
            onMouseDown={resizeHandlers.sw}
          />
          <div
            className="absolute bottom-0 right-0 w-2 h-2 cursor-se-resize"
            onMouseDown={resizeHandlers.se}
          />
        </>
      )}
    </motion.div>
  );
});
