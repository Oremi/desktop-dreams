// Netlify Function for AI chat with streaming (for Netlify deployment)
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

// Simple in-memory rate limiting (per IP, 15 requests/hour)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 15;
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

// Maximum allowed size for portfolioContext (10KB)
const MAX_CONTEXT_SIZE = 10 * 1024;

// Allowed keys in portfolioContext to prevent injection of arbitrary data
const ALLOWED_CONTEXT_KEYS = ['user', 'social', 'skills', 'experience', 'projects'];

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

// Sanitize string values to prevent prompt injection
function sanitizeString(str: string, maxLength: number = 500): string {
  if (typeof str !== 'string') return '';
  // Remove control characters and limit length
  return str.replace(/[\x00-\x1F\x7F]/g, '').substring(0, maxLength);
}

// Validate and sanitize portfolioContext
function validatePortfolioContext(context: unknown): Record<string, unknown> | null {
  if (!context || typeof context !== 'object') {
    return null;
  }

  const contextStr = JSON.stringify(context);
  if (contextStr.length > MAX_CONTEXT_SIZE) {
    console.warn('Portfolio context exceeds maximum size, truncating');
    return null;
  }

  const sanitized: Record<string, unknown> = {};
  const rawContext = context as Record<string, unknown>;

  for (const key of ALLOWED_CONTEXT_KEYS) {
    if (key in rawContext) {
      const value = rawContext[key];
      
      if (key === 'user' && typeof value === 'object' && value !== null) {
        const userObj = value as Record<string, unknown>;
        sanitized[key] = {
          name: sanitizeString(String(userObj.name || ''), 100),
          title: sanitizeString(String(userObj.title || ''), 200),
          bio: sanitizeString(String(userObj.bio || ''), 1000),
        };
      } else if (key === 'social' && typeof value === 'object' && value !== null) {
        const socialObj = value as Record<string, string>;
        sanitized[key] = Object.fromEntries(
          Object.entries(socialObj)
            .slice(0, 10)
            .map(([k, v]) => [sanitizeString(k, 50), sanitizeString(String(v), 200)])
        );
      } else if (key === 'skills' && typeof value === 'object' && value !== null) {
        const skillsObj = value as Record<string, string[]>;
        sanitized[key] = Object.fromEntries(
          Object.entries(skillsObj)
            .slice(0, 10)
            .map(([k, v]) => [
              sanitizeString(k, 50),
              Array.isArray(v) ? v.slice(0, 20).map(s => sanitizeString(String(s), 50)) : []
            ])
        );
      } else if ((key === 'experience' || key === 'projects') && Array.isArray(value)) {
        sanitized[key] = value.slice(0, 20).map(item => {
          if (typeof item === 'object' && item !== null) {
            const obj = item as Record<string, unknown>;
            return Object.fromEntries(
              Object.entries(obj)
                .slice(0, 15)
                .map(([k, v]) => [
                  sanitizeString(k, 50),
                  typeof v === 'string' ? sanitizeString(v, 500) :
                  Array.isArray(v) ? v.slice(0, 10).map(s => sanitizeString(String(s), 100)) : v
                ])
            );
          }
          return null;
        }).filter(Boolean);
      }
    }
  }

  return sanitized;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get client IP for rate limiting
    const clientIP = event.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                     event.headers['client-ip'] || 
                     'unknown';
    
    // Check rate limit
    const rateLimit = checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
      const resetMinutes = Math.ceil(rateLimit.resetIn / 60000);
      return {
        statusCode: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'rate_limit_exceeded',
          message: `Too many requests. Please try again in ${resetMinutes} minutes.`,
          resetIn: rateLimit.resetIn
        })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { message, portfolioContext } = body;
    
    // Validate message
    if (!message || typeof message !== 'string') {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Message is required and must be a string' })
      };
    }

    // Sanitize user message
    const sanitizedMessage = sanitizeString(message, 2000);
    if (sanitizedMessage.length === 0) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Message cannot be empty' })
      };
    }

    // Validate and sanitize portfolio context
    const validatedContext = validatePortfolioContext(portfolioContext);
    const userName = (validatedContext?.user as { name?: string } | undefined)?.name || 'this developer';

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY not configured');
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'AI service not configured. Please set OPENROUTER_API_KEY environment variable.' })
      };
    }

    // Build system prompt with validated portfolio context
    const systemPrompt = `You are an AI assistant for ${userName}'s portfolio website.
You ONLY answer questions about the portfolio owner's information, skills, projects, and experience.
You should be helpful, friendly, and professional.

IMPORTANT RULES:
- Only answer questions related to the portfolio owner
- If asked about unrelated topics, politely redirect to portfolio-related topics
- Keep responses concise and informative
- Use the provided portfolio data to answer accurately

PORTFOLIO DATA:
${JSON.stringify(validatedContext, null, 2)}

If you don't have specific information, say so honestly. Always be helpful in directing visitors to relevant sections of the portfolio.`;

    console.log('Sending streaming request to OpenRouter');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': event.headers.origin || 'https://portfolio.lovable.app',
        'X-Title': 'Portfolio AI Assistant'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        stream: true,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', response.status, errorText);
      
      if (response.status === 429) {
        return {
          statusCode: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            error: 'rate_limit_exceeded',
            message: 'AI service is busy. Please try again in a moment.'
          })
        };
      }
      
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to get AI response' })
      };
    }

    // For Netlify, we need to collect the stream and return it
    // Netlify Functions don't support true streaming, so we return the SSE data as body
    const reader = response.body?.getReader();
    if (!reader) {
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to read AI response stream' })
      };
    }

    const decoder = new TextDecoder();
    let streamData = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      streamData += decoder.decode(value, { stream: true });
    }

    return {
      statusCode: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache'
      },
      body: streamData
    };

  } catch (error) {
    console.error('AI chat error:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })
    };
  }
};
