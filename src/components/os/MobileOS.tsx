import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { DesktopIcon as DesktopIconType } from '@/types/os';
import { cn } from '@/lib/utils';

interface MobileOSProps {
  icons: DesktopIconType[];
  windowComponents: Record<string, React.ComponentType>;
}

export function MobileOS({ icons, windowComponents }: MobileOSProps) {
  const [activeApp, setActiveApp] = useState<DesktopIconType | null>(null);

  const openApp = (icon: DesktopIconType) => {
    setActiveApp(icon);
  };

  const closeApp = () => {
    setActiveApp(null);
  };

  const ActiveComponent = activeApp ? windowComponents[activeApp.component] : null;

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
      <div className="relative z-10 h-full flex flex-col pt-12 pb-6 px-4">
        <h1 className="text-xl font-semibold text-desktop-foreground mb-6 text-center">
          DevOS Portfolio
        </h1>
        
        <div className="grid grid-cols-3 gap-4 content-start flex-1">
          {icons.map((icon) => (
            <button
              key={icon.id}
              onClick={() => openApp(icon)}
              className={cn(
                'flex flex-col items-center justify-center gap-2 p-4 rounded-2xl',
                'bg-desktop-foreground/5 backdrop-blur-sm',
                'active:scale-95 transition-transform'
              )}
            >
              <span className="text-4xl">{icon.icon}</span>
              <span className="text-xs font-medium text-desktop-foreground/90 text-center">
                {icon.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Full Screen Modal */}
      <AnimatePresence>
        {activeApp && ActiveComponent && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-window flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-window-border bg-window-header">
              <div className="flex items-center gap-2">
                <span className="text-xl">{activeApp.icon}</span>
                <span className="font-medium text-window-foreground">
                  {activeApp.title}
                </span>
              </div>
              <button
                onClick={closeApp}
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
    </div>
  );
}
