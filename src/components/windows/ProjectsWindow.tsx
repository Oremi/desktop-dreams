import React, { useState } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
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
    <motion.div 
      className="p-4 space-y-4 transition-all duration-200 ease-out"
      layout
      transition={{ duration: 0.2 }}
    >
      {/* Filter */}
      <motion.div 
        className="flex items-center gap-2 flex-wrap transition-all duration-200"
        layout
        transition={{ duration: 0.2 }}
      >
        <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <motion.button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full text-window-small transition-colors ${
            filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
          }`}
          layout
          transition={{ duration: 0.15 }}
        >
          All
        </motion.button>
        {allTechs.slice(0, 5).map((tech) => (
          <motion.button
            key={tech}
            onClick={() => setFilter(tech)}
            className={`px-3 py-1 rounded-full text-window-small transition-colors ${
              filter === tech ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
            }`}
            layout
            transition={{ duration: 0.15 }}
          >
            {tech}
          </motion.button>
        ))}
      </motion.div>

      {/* Projects Grid */}
      <LayoutGroup>
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-200"
          layout
          transition={{ duration: 0.2 }}
        >
          {filteredProjects.map((project) => (
            <motion.div 
              key={project.id} 
              className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
              layout
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-2xl flex-shrink-0">{project.icon}</span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate text-window-body">{project.name}</h3>
                    <span className="text-window-small text-muted-foreground">{project.year} • {project.category}</span>
                  </div>
                </div>
              </div>
              <p className="text-window-small text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
              <motion.div 
                className="flex flex-wrap gap-1 mb-3 transition-all duration-200"
                layout
                transition={{ duration: 0.15 }}
              >
                {project.tech.map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded bg-muted text-window-small">{t}</span>
                ))}
              </motion.div>
              <div className="flex gap-2 flex-wrap">
                {project.framerLink && (
                  <a href={project.framerLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-window-small hover:opacity-90 transition-opacity">
                    <ExternalLink className="w-3.5 h-3.5" /> Demo
                  </a>
                )}
                {project.githubLink && (
                  <a href={project.githubLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-window-small hover:opacity-90 transition-opacity">
                    <Github className="w-3.5 h-3.5" /> Code
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </LayoutGroup>
    </motion.div>
  );
}
