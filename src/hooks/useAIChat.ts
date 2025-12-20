import { useState, useCallback } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface PortfolioContext {
  user: Record<string, unknown>;
  social: Record<string, unknown>;
  skills: Record<string, unknown>;
  experience: unknown[];
  projects: unknown[];
}

// Detect deployment environment
function getAIEndpoint(): { url: string; type: 'supabase' | 'vercel' | 'netlify' } {
  // Check for explicit environment variable first
  const deployEnv = import.meta.env.VITE_DEPLOYMENT_ENV;
  
  if (deployEnv === 'vercel') {
    return { url: '/api/chat', type: 'vercel' };
  }
  
  if (deployEnv === 'netlify') {
    return { url: '/.netlify/functions/chat', type: 'netlify' };
  }
  
  // Auto-detect based on URL patterns
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  
  // Vercel deployments
  if (hostname.includes('.vercel.app') || hostname.includes('.vercel.') || deployEnv === 'vercel') {
    return { url: '/api/chat', type: 'vercel' };
  }
  
  // Netlify deployments
  if (hostname.includes('.netlify.app') || hostname.includes('.netlify.') || deployEnv === 'netlify') {
    return { url: '/.netlify/functions/chat', type: 'netlify' };
  }
  
  // Default to Supabase edge function (Lovable deployment)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl) {
    return { url: `${supabaseUrl}/functions/v1/ai-chat`, type: 'supabase' };
  }
  
  // Fallback to Vercel API route for local development without Supabase
  return { url: '/api/chat', type: 'vercel' };
}

export function useAIChat(portfolioContext: PortfolioContext) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    setError(null);
    
    // Add user message
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const endpoint = getAIEndpoint();
      console.log(`AI Chat using ${endpoint.type} endpoint:`, endpoint.url);
      
      // Build headers based on endpoint type
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Add auth header for Supabase endpoint
      if (endpoint.type === 'supabase') {
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        if (anonKey) {
          headers['Authorization'] = `Bearer ${anonKey}`;
        }
      }

      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: userMessage,
          portfolioContext
        })
      });

      // Handle rate limit
      if (response.status === 429) {
        const data = await response.json();
        setError(data.message || 'Too many requests. Please try again later.');
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Check if response is streaming (SSE) or JSON
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('text/event-stream')) {
        // Handle streaming response (Supabase edge function & updated Vercel/Netlify)
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMsg]);

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let buffer = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            
            // Process complete lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.trim() || line.startsWith(':')) continue;
              if (!line.startsWith('data: ')) continue;
              
              const jsonStr = line.slice(6).trim();
              if (jsonStr === '[DONE]') continue;

              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullContent += content;
                  setMessages(prev => 
                    prev.map(m => 
                      m.id === assistantMsg.id 
                        ? { ...m, content: fullContent }
                        : m
                    )
                  );
                }
              } catch {
                // Partial JSON, will be handled in next chunk
              }
            }
          }
        }
      } else {
        // Handle JSON response (legacy non-streaming)
        const data = await response.json();
        const content = data.content || data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
        
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMsg]);
      }

    } catch (err) {
      console.error('Chat error:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, portfolioContext]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages
  };
}
