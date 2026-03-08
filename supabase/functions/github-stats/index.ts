import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://eddieo.lovable.app',
  'https://id-preview--2fbd3fc8-b659-49bb-9165-3ada7b09ca08.lovable.app',
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.find(o => origin.startsWith(o)) || ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

// Simple in-memory rate limiting (per IP, 10 requests/hour)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1, resetIn: RATE_WINDOW };
  }
  
  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT - record.count, resetIn: record.resetTime - now };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';
    
    const rateLimit = checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
      const resetMinutes = Math.ceil(rateLimit.resetIn / 60000);
      return new Response(
        JSON.stringify({ error: `Too many requests. Please try again in ${resetMinutes} minutes.` }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { username } = await req.json();
    const githubToken = Deno.env.get('GITHUB_TOKEN');

    if (!githubToken) {
      console.error('GITHUB_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'GitHub integration not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!username || typeof username !== 'string') {
      return new Response(
        JSON.stringify({ error: 'A valid username is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate username format (GitHub usernames: alphanumeric + hyphens, max 39 chars)
    const usernameRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
    if (!usernameRegex.test(username)) {
      return new Response(
        JSON.stringify({ error: 'Invalid GitHub username format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Restrict to portfolio owner's username to prevent open proxy abuse
    const allowedUsername = Deno.env.get('ALLOWED_GITHUB_USERNAME');
    if (allowedUsername && username.toLowerCase() !== allowedUsername.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized username' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers }),
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`, { headers }),
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=10`, { headers })
    ]);

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('GitHub API user error:', userResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch GitHub data. Please try again later.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
