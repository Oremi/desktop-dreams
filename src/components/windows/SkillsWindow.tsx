import React from 'react';
import configData from '@/data/config.json';

const SKILL_COLORS: Record<string, string> = {
  Frontend: 'bg-primary/10 text-primary border-primary/20',
  Backend: 'bg-accent/10 text-accent border-accent/20',
  Tools: 'bg-success/10 text-success border-success/20',
  Other: 'bg-muted text-muted-foreground border-border',
};

export function SkillsWindow() {
  return (
    <div className="p-6 space-y-6">
      {Object.entries(configData.skills).map(([category, skills]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${category === 'Frontend' ? 'bg-primary' : category === 'Backend' ? 'bg-accent' : category === 'Tools' ? 'bg-success' : 'bg-muted-foreground'}`} />
            {category}
          </h3>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span key={skill} className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${SKILL_COLORS[category] || SKILL_COLORS.Other}`}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
