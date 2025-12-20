import React from 'react';
import { ExternalLink, Star, GitFork, Users, BookOpen } from 'lucide-react';
import configData from '@/data/config.json';

export function GitHubWindow() {
  const username = configData.social.github;

  return (
    <div className="p-6 space-y-6 font-mono">
      <div className="flex items-center gap-2 text-success">
        <span className="text-muted-foreground">$</span> github stats --user {username}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-muted/50 text-center">
          <BookOpen className="w-5 h-5 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold">12</div>
          <div className="text-xs text-muted-foreground">Repos</div>
        </div>
        <div className="p-4 rounded-lg bg-muted/50 text-center">
          <Star className="w-5 h-5 mx-auto mb-2 text-yellow-500" />
          <div className="text-2xl font-bold">48</div>
          <div className="text-xs text-muted-foreground">Stars</div>
        </div>
        <div className="p-4 rounded-lg bg-muted/50 text-center">
          <Users className="w-5 h-5 mx-auto mb-2 text-accent" />
          <div className="text-2xl font-bold">156</div>
          <div className="text-xs text-muted-foreground">Followers</div>
        </div>
        <div className="p-4 rounded-lg bg-muted/50 text-center">
          <GitFork className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
          <div className="text-2xl font-bold">23</div>
          <div className="text-xs text-muted-foreground">Forks</div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Note: Add your GITHUB_TOKEN in Cloud secrets for live stats
      </div>

      <a
        href={`https://github.com/${username}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
      >
        <ExternalLink className="w-4 h-4" /> Open GitHub Profile
      </a>
    </div>
  );
}
