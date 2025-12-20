import React from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import configData from '@/data/config.json';

const SKILL_COLORS: Record<string, string> = {
  Frontend: 'bg-primary/10 text-primary border-primary/20',
  Backend: 'bg-accent/10 text-accent border-accent/20',
  Tools: 'bg-success/10 text-success border-success/20',
  Other: 'bg-muted text-muted-foreground border-border',
};

export function SkillsWindow() {
  return (
    <motion.div 
      className="p-6 space-y-6 transition-all duration-200 ease-out"
      layout
      transition={{ duration: 0.2 }}
    >
      <LayoutGroup>
        {Object.entries(configData.skills).map(([category, skills]) => (
          <motion.div 
            key={category}
            layout
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-window-small font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${category === 'Frontend' ? 'bg-primary' : category === 'Backend' ? 'bg-accent' : category === 'Tools' ? 'bg-success' : 'bg-muted-foreground'}`} />
              {category}
            </h3>
            <motion.div 
              className="flex flex-wrap gap-2 transition-all duration-200"
              layout
              transition={{ duration: 0.2 }}
            >
              {skills.map((skill) => (
                <motion.span 
                  key={skill} 
                  className={`px-3 py-1.5 rounded-lg border text-window-small font-medium ${SKILL_COLORS[category] || SKILL_COLORS.Other}`}
                  layout
                  transition={{ duration: 0.15 }}
                >
                  {skill}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>
        ))}
      </LayoutGroup>
    </motion.div>
  );
}
