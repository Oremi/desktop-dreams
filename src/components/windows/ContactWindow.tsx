import React, { useState } from 'react';
import { Send, Mail, Github, Linkedin, Twitter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import configData from '@/data/config.json';

export function ContactWindow() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('contact_messages').insert([form]);
      if (error) throw error;
      toast({ title: 'Message sent!', description: 'Thanks for reaching out.' });
      setForm({ name: '', email: '', message: '' });
    } catch {
      toast({ title: 'Error', description: 'Failed to send message.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
        <span className="text-sm text-success font-medium">Online</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text" placeholder="Your Name" required value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-4 py-3 rounded-lg bg-muted border border-border focus:border-primary focus:outline-none"
        />
        <input
          type="email" placeholder="Your Email" required value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full px-4 py-3 rounded-lg bg-muted border border-border focus:border-primary focus:outline-none"
        />
        <textarea
          placeholder="Your Message" required rows={4} value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full px-4 py-3 rounded-lg bg-muted border border-border focus:border-primary focus:outline-none resize-none"
        />
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50">
          <Send className="w-4 h-4" /> {loading ? 'Sending...' : 'Send Message'}
        </button>
      </form>

      <div className="pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground mb-3">Or reach out directly:</p>
        <div className="flex items-center gap-3">
          <a href={`mailto:${configData.user.email}`} className="p-3 rounded-lg bg-muted hover:bg-muted/80"><Mail className="w-5 h-5" /></a>
          <a href={`https://github.com/${configData.social.github}`} target="_blank" className="p-3 rounded-lg bg-muted hover:bg-muted/80"><Github className="w-5 h-5" /></a>
          <a href={`https://linkedin.com/${configData.social.linkedin}`} target="_blank" className="p-3 rounded-lg bg-muted hover:bg-muted/80"><Linkedin className="w-5 h-5" /></a>
          <a href={`https://twitter.com/${configData.social.twitter}`} target="_blank" className="p-3 rounded-lg bg-muted hover:bg-muted/80"><Twitter className="w-5 h-5" /></a>
        </div>
      </div>
    </div>
  );
}
