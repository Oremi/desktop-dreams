import React from 'react';
import { MapPin, Mail, Clock } from 'lucide-react';
import configData from '@/data/config.json';

export function AboutWindow() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl">
          👨‍💻
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{configData.user.name}</h1>
          <p className="text-primary font-medium">{configData.user.title}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {configData.user.location}
            </span>
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              {configData.user.email}
            </span>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/20 w-fit">
        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
        <span className="text-sm text-success font-medium">{configData.user.status}</span>
      </div>

      {/* Bio */}
      <div className="space-y-3">
        {configData.user.bio.map((paragraph, index) => (
          <p key={index} className="text-muted-foreground leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Quick Skills */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Top Skills</h3>
        <div className="flex flex-wrap gap-2">
          {configData.skills.Frontend.slice(0, 4).map((skill) => (
            <span key={skill} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {skill}
            </span>
          ))}
          {configData.skills.Backend.slice(0, 2).map((skill) => (
            <span key={skill} className="px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium">
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
