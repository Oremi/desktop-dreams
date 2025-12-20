import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
    <motion.div 
      className="p-6 space-y-6 transition-all duration-200 ease-out"
      layout
      transition={{ duration: 0.2 }}
    >
      <motion.div 
        className="flex items-center gap-2"
        layout
        transition={{ duration: 0.2 }}
      >
        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
        <span className="text-window-small text-success font-medium">Online</span>
      </motion.div>

      <motion.form 
        onSubmit={handleSubmit} 
        className="space-y-4 transition-all duration-200"
        layout
        transition={{ duration: 0.2 }}
      >
        <motion.input
          type="text" placeholder="Your Name" required value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-4 py-3 rounded-lg bg-muted border border-border focus:border-primary focus:outline-none transition-all duration-200"
          layout
          transition={{ duration: 0.15 }}
        />
        <motion.input
          type="email" placeholder="Your Email" required value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full px-4 py-3 rounded-lg bg-muted border border-border focus:border-primary focus:outline-none transition-all duration-200"
          layout
          transition={{ duration: 0.15 }}
        />
        <motion.textarea
          placeholder="Your Message" required rows={4} value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full px-4 py-3 rounded-lg bg-muted border border-border focus:border-primary focus:outline-none resize-none transition-all duration-200"
          layout
          transition={{ duration: 0.15 }}
        />
        <motion.button 
          type="submit" 
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 transition-all duration-200"
          layout
          transition={{ duration: 0.15 }}
        >
          <Send className="w-4 h-4" /> {loading ? 'Sending...' : 'Send Message'}
        </motion.button>
      </motion.form>

      <motion.div 
        className="pt-4 border-t border-border transition-all duration-200"
        layout
        transition={{ duration: 0.2 }}
      >
        <p className="text-window-small text-muted-foreground mb-3">Or reach out directly:</p>
        <motion.div 
          className="flex items-center gap-3 flex-wrap"
          layout
          transition={{ duration: 0.2 }}
        >
          <motion.a 
            href={`mailto:${configData.user.email}`} 
            className="p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            layout
            transition={{ duration: 0.15 }}
          >
            <Mail className="w-5 h-5" />
          </motion.a>
          <motion.a 
            href={`https://github.com/${configData.social.github}`} 
            target="_blank" 
            className="p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            layout
            transition={{ duration: 0.15 }}
          >
            <Github className="w-5 h-5" />
          </motion.a>
          <motion.a 
            href={`https://linkedin.com/${configData.social.linkedin}`} 
            target="_blank" 
            className="p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            layout
            transition={{ duration: 0.15 }}
          >
            <Linkedin className="w-5 h-5" />
          </motion.a>
          <motion.a 
            href={`https://twitter.com/${configData.social.twitter}`} 
            target="_blank" 
            className="p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            layout
            transition={{ duration: 0.15 }}
          >
            <Twitter className="w-5 h-5" />
          </motion.a>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
