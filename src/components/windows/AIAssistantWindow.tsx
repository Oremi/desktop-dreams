import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles, Trash2, AlertCircle, Settings } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAIChat, ChatMessage } from '@/hooks/useAIChat';
import configData from '@/data/config.json';
import projectsData from '@/data/projects.json';

const QUICK_PROMPTS = [
  "What are your skills?",
  "Tell me about your projects",
  "How can I contact you?",
  "What's your experience?"
];

export function AIAssistantWindow() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Build portfolio context from JSON files
  const portfolioContext = {
    user: configData.user,
    social: configData.social,
    skills: configData.skills,
    experience: configData.experience,
    projects: projectsData.projects
  };

  const { messages, isLoading, error, configError, sendMessage, clearMessages } = useAIChat(portfolioContext);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    if (!isLoading) {
      sendMessage(prompt);
    }
  };

  // Show configuration error fallback UI
  if (configError) {
    return (
      <motion.div 
        className="flex flex-col h-full items-center justify-center p-6 text-center"
        layout
        transition={{ duration: 0.2 }}
      >
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Settings className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">AI Assistant Unavailable</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-xs">
          The AI assistant is not configured on this deployment. This feature requires an API key to be set up by the site owner.
        </p>
        <div className="text-xs text-muted-foreground/70 space-y-1">
          <p>If you're the site owner:</p>
          <p className="font-mono bg-muted px-2 py-1 rounded">OPENROUTER_API_KEY</p>
          <p>needs to be configured in your hosting environment.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="flex flex-col h-full"
      layout
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Ask about {configData.user.name.split(' ')[0]}'s portfolio</span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Portfolio AI Assistant</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Ask me anything about {configData.user.name}'s skills, projects, or experience!
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleQuickPrompt(prompt)}
                  className="px-3 py-1.5 text-sm rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 p-3 rounded-2xl rounded-tl-sm bg-muted">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about skills, projects, experience..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg bg-muted border border-border focus:border-primary focus:outline-none transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Limited to 15 questions per hour
        </p>
      </form>
    </motion.div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-primary' : 'bg-primary/10'
      }`}>
        {isUser ? (
          <span className="text-primary-foreground text-sm">You</span>
        ) : (
          <Sparkles className="w-4 h-4 text-primary" />
        )}
      </div>
      <div className={`flex-1 max-w-[80%] p-3 rounded-2xl ${
        isUser 
          ? 'rounded-tr-sm bg-primary text-primary-foreground' 
          : 'rounded-tl-sm bg-muted'
      }`}>
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-pre:my-2 prose-pre:bg-background/50 prose-pre:p-2 prose-pre:rounded prose-code:bg-background/50 prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
