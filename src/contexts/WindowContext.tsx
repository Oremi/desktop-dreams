import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { WindowState, DesktopIcon } from '@/types/os';

interface WindowContextType {
  windows: WindowState[];
  activeWindowId: string | null;
  openWindow: (icon: DesktopIcon) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowPosition: (
    id: string,
    positionOrUpdater: { x: number; y: number } | ((current: { x: number; y: number }) => { x: number; y: number })
  ) => void;
  updateWindowSize: (id: string, size: { width: number; height: number }) => void;
}

const WindowContext = createContext<WindowContextType | undefined>(undefined);

const DEFAULT_WINDOW_SIZE = { width: 800, height: 600 };
const DEFAULT_POSITION_OFFSET = 30;

export function WindowProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [nextZIndex, setNextZIndex] = useState(1);

  const getNewPosition = useCallback(() => {
    const existingCount = windows.length;
    const offset = (existingCount % 5) * DEFAULT_POSITION_OFFSET;
    return {
      x: 100 + offset,
      y: 50 + offset,
    };
  }, [windows.length]);

  const openWindow = useCallback((icon: DesktopIcon) => {
    setWindows((prev) => {
      const existingWindow = prev.find((w) => w.id === icon.id);
      
      if (existingWindow) {
        // If window exists, restore and focus it
        return prev.map((w) =>
          w.id === icon.id
            ? { ...w, isMinimized: false, zIndex: nextZIndex }
            : w
        );
      }

      // Create new window
      const newWindow: WindowState = {
        id: icon.id,
        title: icon.title,
        icon: icon.icon,
        isOpen: true,
        isMinimized: false,
        isMaximized: false,
        position: getNewPosition(),
        size: DEFAULT_WINDOW_SIZE,
        zIndex: nextZIndex,
        component: icon.component,
      };

      return [...prev, newWindow];
    });

    setActiveWindowId(icon.id);
    setNextZIndex((prev) => prev + 1);
  }, [getNewPosition, nextZIndex]);

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    setActiveWindowId((prev) => (prev === id ? null : prev));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w))
    );
    setActiveWindowId((prev) => (prev === id ? null : prev));
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w))
    );
  }, []);

  const restoreWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, isMinimized: false, zIndex: nextZIndex } : w
      )
    );
    setActiveWindowId(id);
    setNextZIndex((prev) => prev + 1);
  }, [nextZIndex]);

  const focusWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, zIndex: nextZIndex } : w))
    );
    setActiveWindowId(id);
    setNextZIndex((prev) => prev + 1);
  }, [nextZIndex]);

  const updateWindowPosition = useCallback(
    (
      id: string,
      positionOrUpdater: { x: number; y: number } | ((current: { x: number; y: number }) => { x: number; y: number })
    ) => {
      setWindows((prev) =>
        prev.map((w) => {
          if (w.id !== id) return w;
          const newPosition =
            typeof positionOrUpdater === 'function'
              ? positionOrUpdater(w.position)
              : positionOrUpdater;
          return { ...w, position: newPosition };
        })
      );
    },
    []
  );

  const updateWindowSize = useCallback(
    (id: string, size: { width: number; height: number }) => {
      setWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, size } : w))
      );
    },
    []
  );

  return (
    <WindowContext.Provider
      value={{
        windows,
        activeWindowId,
        openWindow,
        closeWindow,
        minimizeWindow,
        maximizeWindow,
        restoreWindow,
        focusWindow,
        updateWindowPosition,
        updateWindowSize,
      }}
    >
      {children}
    </WindowContext.Provider>
  );
}

export function useWindowContext() {
  const context = useContext(WindowContext);
  if (!context) {
    throw new Error('useWindowContext must be used within a WindowProvider');
  }
  return context;
}
