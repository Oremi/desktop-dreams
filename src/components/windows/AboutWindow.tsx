import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Mail } from 'lucide-react';
import configData from '@/data/config.json';

export function AboutWindow() {
  return (
    <motion.div 
      className="p-6 space-y-6 transition-all duration-200 ease-out"
      layout
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* Header */}
      <motion.div 
        className="flex items-start gap-4 transition-all duration-200"
        layout
        transition={{ duration: 0.2 }}
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl flex-shrink-0">
          👨‍💻
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-window-title font-bold text-foreground">{configData.user.name}</h1>
          <p className="text-window-subtitle text-primary font-medium">{configData.user.title}</p>
          <div className="flex items-center gap-4 mt-2 text-window-small text-muted-foreground flex-wrap transition-all duration-200">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              {configData.user.location}
            </span>
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
              {configData.user.email}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Status */}
      <motion.div 
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/20 w-fit"
        layout
        transition={{ duration: 0.2 }}
      >
        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
        <span className="text-window-small text-success font-medium">{configData.user.status}</span>
      </motion.div>

      {/* Bio */}
      <motion.div 
        className="space-y-3 transition-all duration-200"
        layout
        transition={{ duration: 0.2 }}
      >
        {configData.user.bio.map((paragraph, index) => (
          <p key={index} className="text-window-body text-muted-foreground leading-relaxed">
            {paragraph}
          </p>
        ))}
      </motion.div>

      {/* Quick Skills */}
      <motion.div layout transition={{ duration: 0.2 }}>
        <h3 className="text-window-small font-semibold text-foreground mb-3">Top Skills</h3>
        <motion.div 
          className="flex flex-wrap gap-2 transition-all duration-200"
          layout
          transition={{ duration: 0.2 }}
        >
          {configData.skills["IT Support"].slice(0, 3).map((skill) => (
            <motion.span 
              key={skill} 
              className="px-3 py-1 rounded-full bg-primary/10 text-primary text-window-small font-medium"
              layout
              transition={{ duration: 0.15 }}
            >
              {skill}
            </motion.span>
          ))}
          {configData.skills["Data & Tools"].slice(0, 3).map((skill) => (
            <motion.span 
              key={skill} 
              className="px-3 py-1 rounded-full bg-accent/10 text-accent text-window-small font-medium"
              layout
              transition={{ duration: 0.15 }}
            >
              {skill}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
