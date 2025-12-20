import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Moon } from 'lucide-react';
import { DesktopIcon as DesktopIconType } from '@/types/os';
import { cn } from '@/lib/utils';
import { useWindowContext } from '@/contexts/WindowContext';
import { useTheme } from '@/contexts/ThemeContext';

interface MobileOSProps {
  icons: DesktopIconType[];
  windowComponents: Record<string, React.ComponentType>;
}

export function MobileOS({ icons, windowComponents }: MobileOSProps) {
  const { windows, openWindow, closeWindow, focusWindow } = useWindowContext();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const openWindows = windows.filter((w) => w.isOpen && !w.isMinimized);
  const activeWindow = openWindows.length > 0 
    ? openWindows.reduce((a, b) => (a.zIndex > b.zIndex ? a : b))
    : null;

  const handleOpenApp = (icon: DesktopIconType) => {
    openWindow({
      id: icon.id,
      title: icon.title,
      icon: icon.icon,
      component: icon.component,
    });
  };

  const handleTabClick = (windowId: string) => {
    focusWindow(windowId);
  };

  const ActiveComponent = activeWindow
    ? windowComponents[activeWindow.component]
    : null;

  const activeIcon = activeWindow
    ? icons.find((i) => i.id === activeWindow.id)
    : null;

  // Format time
  const [time, setTime] = React.useState(new Date());
  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-desktop">
      {/* Wallpaper */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 20% 80%, hsl(217 91% 60% / 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, hsl(262 83% 58% / 0.1) 0%, transparent 50%)
          `,
        }}
      />

      {/* App Grid */}
      <div className="relative z-10 h-full flex flex-col pt-12 pb-20 px-4">
        <h1 className="text-xl font-semibold text-desktop-foreground mb-6 text-center">
          DevOS Portfolio
        </h1>

        <div className="grid grid-cols-3 gap-4 content-start flex-1">
          {icons.map((icon) => {
            const isOpen = windows.some((w) => w.id === icon.id && w.isOpen);
            return (
              <button
                key={icon.id}
                onClick={() => handleOpenApp(icon)}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 p-4 rounded-2xl',
                  'bg-desktop-foreground/5 backdrop-blur-sm',
                  'active:scale-95 transition-transform',
                  isOpen && 'ring-2 ring-primary/50'
                )}
              >
                <span className="text-4xl">{icon.icon}</span>
                <span className="text-xs font-medium text-desktop-foreground/90 text-center">
                  {icon.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Full Screen Window Modal */}
      <AnimatePresence>
        {activeWindow && ActiveComponent && (
          <motion.div
            key={activeWindow.id}
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-40 bg-window flex flex-col"
            style={{ bottom: '56px' }} // Leave room for taskbar
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-window-border bg-window-header">
              <div className="flex items-center gap-2">
                <span className="text-xl">{activeIcon?.icon}</span>
                <span className="font-medium text-window-foreground">
                  {activeWindow.title}
                </span>
              </div>
              <button
                onClick={() => closeWindow(activeWindow.id)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto">
              <ActiveComponent />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Taskbar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 h-14 bg-taskbar/95 backdrop-blur-md border-t border-taskbar-border flex items-center justify-between px-2">
        {/* Window Tabs */}
        <div className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-hide">
          {openWindows.map((win) => {
            const icon = icons.find((i) => i.id === win.id);
            const isActive = activeWindow?.id === win.id;
            return (
              <button
                key={win.id}
                onClick={() => handleTabClick(win.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors min-w-0 shrink-0',
                  isActive
                    ? 'bg-primary/20 text-primary'
                    : 'bg-taskbar-foreground/10 text-taskbar-foreground/70 hover:bg-taskbar-foreground/20'
                )}
              >
                <span className="text-lg">{icon?.icon}</span>
                <span className="text-xs font-medium truncate max-w-16">
                  {win.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* System Tray */}
        <div className="flex items-center gap-2 pl-2 border-l border-taskbar-border">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-taskbar-foreground/10 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-taskbar-foreground/80" />
            ) : (
              <Moon className="w-5 h-5 text-taskbar-foreground/80" />
            )}
          </button>

          {/* Time */}
          <span className="text-xs font-medium text-taskbar-foreground/80 pr-1">
            {formattedTime}
          </span>
        </div>
      </div>
    </div>
  );
}
