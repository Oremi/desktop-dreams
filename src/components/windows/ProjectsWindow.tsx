import React, { useState } from 'react';
import { ExternalLink, Github, Filter } from 'lucide-react';
import projectsData from '@/data/projects.json';
import { Project } from '@/types/os';

export function ProjectsWindow() {
  const [filter, setFilter] = useState<string>('all');
  const projects = projectsData.projects as Project[];
  
  const allTechs = [...new Set(projects.flatMap((p) => p.tech))];
  const filteredProjects = filter === 'all' 
    ? projects 
    : projects.filter((p) => p.tech.includes(filter));

  return (
    <div className="p-4 space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
          }`}
        >
          All
        </button>
        {allTechs.slice(0, 5).map((tech) => (
          <button
            key={tech}
            onClick={() => setFilter(tech)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filter === tech ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {tech}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProjects.map((project) => (
          <div key={project.id} className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{project.icon}</span>
                <div>
                  <h3 className="font-semibold text-foreground">{project.name}</h3>
                  <span className="text-xs text-muted-foreground">{project.year} • {project.category}</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {project.tech.map((t) => (
                <span key={t} className="px-2 py-0.5 rounded bg-muted text-xs">{t}</span>
              ))}
            </div>
            <div className="flex gap-2">
              {project.framerLink && (
                <a href={project.framerLink} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90">
                  <ExternalLink className="w-3.5 h-3.5" /> Demo
                </a>
              )}
              {project.githubLink && (
                <a href={project.githubLink} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-sm hover:opacity-90">
                  <Github className="w-3.5 h-3.5" /> Code
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
