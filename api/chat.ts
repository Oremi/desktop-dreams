// Vercel API route for AI chat (for GitHub/Vercel deployment)
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
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
      return res.status(500).json({ error: 'AI service not configured' });
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

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://portfolio.lovable.app',
        'X-Title': 'Portfolio AI Assistant'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        stream: false,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', response.status, errorText);
      return res.status(500).json({ error: 'Failed to get AI response' });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    return res.status(200).json({ content });

  } catch (error) {
    console.error('AI chat error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
