import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username } = await req.json();
    const githubToken = Deno.env.get('GITHUB_TOKEN');

    if (!githubToken) {
      console.error('GITHUB_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'GitHub token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!username) {
      return new Response(
        JSON.stringify({ error: 'Username is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const headers = {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'DevOS-Portfolio'
    };

    console.log(`Fetching GitHub stats for user: ${username}`);

    // Fetch user profile, repos, and events in parallel
    const [userResponse, reposResponse, eventsResponse] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, { headers }),
      fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers }),
      fetch(`https://api.github.com/users/${username}/events/public?per_page=10`, { headers })
    ]);

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('GitHub API user error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user data', details: errorText }),
        { status: userResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const user = await userResponse.json();
    const repos = reposResponse.ok ? await reposResponse.json() : [];
    const events = eventsResponse.ok ? await eventsResponse.json() : [];

    // Calculate total stars and forks
    const totalStars = repos.reduce((sum: number, repo: any) => sum + (repo.stargazers_count || 0), 0);
    const totalForks = repos.reduce((sum: number, repo: any) => sum + (repo.forks_count || 0), 0);

    // Get top repositories by stars
    const topRepos = [...repos]
      .sort((a: any, b: any) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
      .slice(0, 5)
      .map((repo: any) => ({
        name: repo.name,
        description: repo.description,
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        language: repo.language,
        url: repo.html_url
      }));

    // Get recent commits from push events
    const recentCommits = events
      .filter((event: any) => event.type === 'PushEvent')
      .slice(0, 5)
      .map((event: any) => ({
        repo: event.repo.name.split('/')[1],
        message: event.payload.commits?.[0]?.message || 'No message',
        date: event.created_at,
        sha: event.payload.commits?.[0]?.sha?.substring(0, 7) || ''
      }));

    const stats = {
      username: user.login,
      name: user.name,
      avatar: user.avatar_url,
      bio: user.bio,
      publicRepos: user.public_repos,
      followers: user.followers,
      following: user.following,
      totalStars,
      totalForks,
      topRepos,
      recentCommits,
      profileUrl: user.html_url
    };

    console.log('Successfully fetched GitHub stats');

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in github-stats function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
