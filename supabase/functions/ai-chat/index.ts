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

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';
    
    // Check rate limit
    const rateLimit = checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
      const resetMinutes = Math.ceil(rateLimit.resetIn / 60000);
      return new Response(
        JSON.stringify({ 
          error: 'rate_limit_exceeded',
          message: `Too many requests. Please try again in ${resetMinutes} minutes.`,
          resetIn: rateLimit.resetIn
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetIn / 1000))
          } 
        }
      );
    }

    const { message, portfolioContext } = await req.json();
    
    // Validate message
    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize user message
    const sanitizedMessage = sanitizeString(message, 2000);
    if (sanitizedMessage.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message cannot be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and sanitize portfolio context
    const validatedContext = validatePortfolioContext(portfolioContext);
    const userName = (validatedContext?.user as { name?: string } | undefined)?.name || 'this developer';

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    console.log('Sending request to Lovable AI with message:', message.substring(0, 100));

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
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
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI service is busy. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service temporarily unavailable.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to get AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Stream the response
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-RateLimit-Remaining': String(rateLimit.remaining)
      }
    });

  } catch (error) {
    console.error('AI chat unhandled error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
