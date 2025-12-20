import React from 'react';
import { Briefcase } from 'lucide-react';
import configData from '@/data/config.json';

export function ExperienceWindow() {
  return (
    <div className="p-6">
      <div className="relative space-y-6">
        {/* Timeline line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
        
        {configData.experience.map((exp, index) => (
          <div key={exp.id} className="relative pl-8">
            {/* Timeline dot */}
            <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center ${index === 0 ? 'bg-primary' : 'bg-muted border-2 border-border'}`}>
              <Briefcase className={`w-3 h-3 ${index === 0 ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
            </div>
            
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-foreground">{exp.role}</h3>
                  <p className="text-sm text-primary">{exp.company}</p>
                </div>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{exp.period}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{exp.description}</p>
              <div className="flex flex-wrap gap-2">
                {exp.highlights.map((h, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-full bg-success/10 text-success">{h}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
