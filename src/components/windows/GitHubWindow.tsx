import React, { useEffect, useState } from 'react';
import { ExternalLink, Star, GitFork, Users, BookOpen, GitCommit, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import configData from '@/data/config.json';

interface GitHubStats {
  username: string;
  name: string;
  avatar: string;
  bio: string;
  publicRepos: number;
  followers: number;
  following: number;
  totalStars: number;
  totalForks: number;
  topRepos: Array<{
    name: string;
    description: string;
    stars: number;
    forks: number;
    language: string;
    url: string;
  }>;
  recentCommits: Array<{
    repo: string;
    message: string;
    date: string;
    sha: string;
  }>;
  profileUrl: string;
}

export function GitHubWindow() {
  const username = configData.social.github;
  const [stats, setStats] = useState<GitHubStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('github-stats', {
        body: { username }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setStats(data);
    } catch (err) {
      console.error('Error fetching GitHub stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [username]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-6 space-y-6 font-mono">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-success">
          <span className="text-muted-foreground">$</span> github stats --user {username}
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 rounded-lg bg-muted/50 animate-pulse">
                <div className="w-5 h-5 mx-auto mb-2 bg-muted rounded" />
                <div className="w-8 h-6 mx-auto mb-1 bg-muted rounded" />
                <div className="w-12 h-3 mx-auto bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
          <p>Error: {error}</p>
          <p className="text-xs mt-2 text-muted-foreground">
            Make sure your GITHUB_TOKEN is configured correctly.
          </p>
        </div>
      )}

      {stats && !loading && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center gpu-accelerate hover:bg-muted/70 transition-colors">
              <BookOpen className="w-5 h-5 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stats.publicRepos}</div>
              <div className="text-xs text-muted-foreground">Repos</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center gpu-accelerate hover:bg-muted/70 transition-colors">
              <Star className="w-5 h-5 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{stats.totalStars}</div>
              <div className="text-xs text-muted-foreground">Stars</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center gpu-accelerate hover:bg-muted/70 transition-colors">
              <Users className="w-5 h-5 mx-auto mb-2 text-accent" />
              <div className="text-2xl font-bold">{stats.followers}</div>
              <div className="text-xs text-muted-foreground">Followers</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center gpu-accelerate hover:bg-muted/70 transition-colors">
              <GitFork className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.totalForks}</div>
              <div className="text-xs text-muted-foreground">Forks</div>
            </div>
          </div>

          {/* Top Repositories */}
          {stats.topRepos.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Top Repositories</h3>
              <div className="space-y-2">
                {stats.topRepos.slice(0, 3).map((repo) => (
                  <a
                    key={repo.name}
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors gpu-accelerate"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{repo.name}</span>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {repo.language && (
                          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">
                            {repo.language}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" /> {repo.stars}
                        </span>
                        <span className="flex items-center gap-1">
                          <GitFork className="w-3 h-3" /> {repo.forks}
                        </span>
                      </div>
                    </div>
                    {repo.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {repo.description}
                      </p>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Recent Commits */}
          {stats.recentCommits.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Recent Activity</h3>
              <div className="space-y-2">
                {stats.recentCommits.slice(0, 3).map((commit, index) => (
                  <div
                    key={`${commit.sha}-${index}`}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <GitCommit className="w-4 h-4 mt-0.5 text-success" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{commit.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {commit.repo} · {formatDate(commit.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <a
        href={stats?.profileUrl || `https://github.com/${username}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity gpu-accelerate"
      >
        <ExternalLink className="w-4 h-4" /> Open GitHub Profile
      </a>
    </div>
  );
}
