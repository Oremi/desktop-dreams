import React from 'react';
import { cn } from '@/lib/utils';

interface DesktopIconProps {
  icon: string;
  title: string;
  onDoubleClick: () => void;
  isSelected?: boolean;
}

export function DesktopIcon({ icon, title, onDoubleClick, isSelected }: DesktopIconProps) {
  const [clicks, setClicks] = React.useState(0);
  const clickTimeout = React.useRef<NodeJS.Timeout>();

  const handleClick = () => {
    setClicks((prev) => prev + 1);
    
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
    }

    clickTimeout.current = setTimeout(() => {
      setClicks(0);
    }, 300);

    if (clicks === 1) {
      onDoubleClick();
      setClicks(0);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg',
        'w-24 h-24 text-center transition-all duration-150',
        'hover:bg-desktop-foreground/10 active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-primary/50',
        isSelected && 'bg-desktop-foreground/15'
      )}
    >
      <span className="text-4xl drop-shadow-lg">{icon}</span>
      <span className="text-xs font-medium text-desktop-foreground drop-shadow-md line-clamp-2">
        {title}
      </span>
    </button>
  );
}
