import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { DesktopIcon } from './DesktopIcon';
import { WindowFrame } from './WindowFrame';
import { Taskbar } from './Taskbar';
import { MobileOS } from './MobileOS';
import { AboutWindow } from '../windows/AboutWindow';
import { ProjectsWindow } from '../windows/ProjectsWindow';
import { ContactWindow } from '../windows/ContactWindow';
import { GitHubWindow } from '../windows/GitHubWindow';
import { SkillsWindow } from '../windows/SkillsWindow';
import { ExperienceWindow } from '../windows/ExperienceWindow';
import { useWindowContext, WindowProvider } from '@/contexts/WindowContext';
import { useIsMobileOS } from '@/hooks/useIsMobileOS';
import { DesktopIcon as DesktopIconType } from '@/types/os';

const DESKTOP_ICONS: DesktopIconType[] = [
  { id: 'about', title: 'About Me', icon: '📄', component: 'AboutWindow' },
  { id: 'projects', title: 'Projects', icon: '📁', component: 'ProjectsWindow' },
  { id: 'contact', title: 'Contact', icon: '📧', component: 'ContactWindow' },
  { id: 'github', title: 'GitHub', icon: '🐙', component: 'GitHubWindow' },
  { id: 'skills', title: 'Skills', icon: '🎯', component: 'SkillsWindow' },
  { id: 'experience', title: 'Experience', icon: '📅', component: 'ExperienceWindow' },
];

const WINDOW_COMPONENTS: Record<string, React.ComponentType> = {
  AboutWindow,
  ProjectsWindow,
  ContactWindow,
  GitHubWindow,
  SkillsWindow,
  ExperienceWindow,
};

function DesktopContent() {
  const { windows, openWindow } = useWindowContext();
  const isMobile = useIsMobileOS();

  // Open About window by default on mount
  React.useEffect(() => {
    const aboutIcon = DESKTOP_ICONS.find((icon) => icon.id === 'about');
    if (aboutIcon) {
      openWindow(aboutIcon);
    }
  }, []);

  if (isMobile) {
    return <MobileOS icons={DESKTOP_ICONS} windowComponents={WINDOW_COMPONENTS} />;
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-desktop">
      {/* Wallpaper / Background */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 20% 80%, hsl(217 91% 60% / 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, hsl(262 83% 58% / 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, hsl(217 33% 17% / 0.8) 0%, transparent 100%)
          `,
        }}
      />

      {/* Desktop Icons Grid */}
      <div className="absolute top-4 left-4 grid grid-cols-1 gap-1">
        {DESKTOP_ICONS.map((icon) => (
          <DesktopIcon
            key={icon.id}
            icon={icon.icon}
            title={icon.title}
            onDoubleClick={() => openWindow(icon)}
          />
        ))}
      </div>

      {/* Windows */}
      <AnimatePresence>
        {windows.map((window) => {
          if (!window.isOpen) return null;
          const WindowComponent = WINDOW_COMPONENTS[window.component];
          if (!WindowComponent) return null;

          return (
            <WindowFrame key={window.id} window={window}>
              <WindowComponent />
            </WindowFrame>
          );
        })}
      </AnimatePresence>

      {/* Taskbar */}
      <Taskbar />
    </div>
  );
}

export function Desktop() {
  return (
    <WindowProvider>
      <DesktopContent />
    </WindowProvider>
  );
}
