import React from 'react';
import { format } from 'date-fns';
import { Github, Linkedin, Twitter } from 'lucide-react';
import { WindowState } from '@/types/os';
import { useWindowContext } from '@/contexts/WindowContext';
import { cn } from '@/lib/utils';
import configData from '@/data/config.json';

interface TaskbarProps {
  className?: string;
}

export function Taskbar({ className }: TaskbarProps) {
  const { windows, restoreWindow, focusWindow, activeWindowId } = useWindowContext();
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const openWindows = windows.filter((w) => w.isOpen);

  const handleTaskbarClick = (window: WindowState) => {
    if (window.isMinimized) {
      restoreWindow(window.id);
    } else {
      focusWindow(window.id);
    }
  };

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 h-12 z-50',
        'bg-taskbar/90 backdrop-blur-xl border-t border-window-border',
        'flex items-center justify-between px-3',
        'taskbar-shadow',
        className
      )}
    >
      {/* Left - Social Links */}
      <div className="flex items-center gap-1">
        <a
          href={`https://github.com/${configData.social.github}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Github className="w-4 h-4 text-taskbar-foreground" />
        </a>
        <a
          href={`https://linkedin.com/${configData.social.linkedin}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Linkedin className="w-4 h-4 text-taskbar-foreground" />
        </a>
        <a
          href={`https://twitter.com/${configData.social.twitter}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Twitter className="w-4 h-4 text-taskbar-foreground" />
        </a>
      </div>

      {/* Center - Open Windows */}
      <div className="flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
        {openWindows.map((window) => (
          <button
            key={window.id}
            onClick={() => handleTaskbarClick(window)}
            className={cn(
              'relative flex items-center justify-center p-2.5 rounded-lg',
              'transition-all duration-150 hover:bg-muted',
              activeWindowId === window.id && !window.isMinimized
                ? 'bg-muted'
                : '',
              window.isMinimized && 'opacity-60'
            )}
          >
            <span className="text-lg">{window.icon}</span>
            {/* Active indicator */}
            <div
              className={cn(
                'absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all',
                activeWindowId === window.id && !window.isMinimized
                  ? 'w-4 bg-primary'
                  : 'w-1.5 bg-muted-foreground'
              )}
            />
          </button>
        ))}
      </div>

      {/* Right - System Tray */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-xs font-medium text-taskbar-foreground">
            {format(time, 'h:mm a')}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {format(time, 'MMM d, yyyy')}
          </div>
        </div>
      </div>
    </div>
  );
}
