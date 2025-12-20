export interface WindowState {
  id: string;
  title: string;
  icon: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  component: string;
}

export interface DesktopIcon {
  id: string;
  title: string;
  icon: string;
  component: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  year: number;
  tech: string[];
  framerLink: string;
  githubLink: string;
  icon: string;
  category: "personal" | "professional";
  featured?: boolean;
}

export interface Experience {
  id: number;
  company: string;
  role: string;
  period: string;
  description: string;
  highlights: string[];
}

export interface UserConfig {
  name: string;
  title: string;
  email: string;
  location: string;
  phone: string;
  bio: string[];
  avatar: string;
  status: string;
}

export interface SocialConfig {
  github: string;
  twitter: string;
  linkedin: string;
  website: string;
}

export interface Config {
  user: UserConfig;
  social: SocialConfig;
  skills: Record<string, string[]>;
  experience: Experience[];
  theme: {
    darkMode: boolean;
    accentColor: string;
    wallpaper: string;
  };
}

export interface GitHubStats {
  publicRepos: number;
  followers: number;
  following: number;
  totalStars: number;
}

export interface GitHubRepo {
  id: number;
  name: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  url: string;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  date: string;
  repo: string;
}

export interface ContactMessage {
  name: string;
  email: string;
  message: string;
}
