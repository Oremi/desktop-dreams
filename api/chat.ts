// Vercel API route for AI chat with streaming (for GitHub/Vercel deployment)
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple in-memory rate limiting (per IP, 15 requests/hour)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 15;
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                     req.headers['x-real-ip'] as string || 
                     'unknown';
    
    // Check rate limit
    const rateLimit = checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
      const resetMinutes = Math.ceil(rateLimit.resetIn / 60000);
      return res.status(429).json({ 
        error: 'rate_limit_exceeded',
        message: `Too many requests. Please try again in ${resetMinutes} minutes.`,
        resetIn: rateLimit.resetIn
      });
    }

    const { message, portfolioContext } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY not configured');
      return res.status(500).json({ error: 'AI service not configured. Please set OPENROUTER_API_KEY environment variable.' });
    }

    // Build system prompt with portfolio context
    const systemPrompt = `You are an AI assistant for ${portfolioContext?.user?.name || 'this developer'}'s portfolio website. 
You ONLY answer questions about the portfolio owner's information, skills, projects, and experience.
You should be helpful, friendly, and professional.

IMPORTANT RULES:
- Only answer questions related to the portfolio owner
- If asked about unrelated topics, politely redirect to portfolio-related topics
- Keep responses concise and informative
- Use the provided portfolio data to answer accurately

PORTFOLIO DATA:
${JSON.stringify(portfolioContext, null, 2)}

If you don't have specific information, say so honestly. Always be helpful in directing visitors to relevant sections of the portfolio.`;

    console.log('Sending streaming request to OpenRouter');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.origin || 'https://portfolio.lovable.app',
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
        return res.status(429).json({ 
          error: 'rate_limit_exceeded',
          message: 'AI service is busy. Please try again in a moment.'
        });
      }
      
      return res.status(500).json({ error: 'Failed to get AI response' });
    }

    // Set up SSE streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream the response from OpenRouter to the client
    const reader = response.body?.getReader();
    if (!reader) {
      return res.status(500).json({ error: 'Failed to read AI response stream' });
    }

    const decoder = new TextDecoder();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        res.write(chunk);
      }
    } catch (streamError) {
      console.error('Stream error:', streamError);
    } finally {
      res.end();
    }

  } catch (error) {
    console.error('AI chat error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
