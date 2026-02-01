// Codebase Learn - Available Codebases
// All public repos from odgsully GitHub

import type { Codebase } from './types';

// TODO: Create ./data/adhs-working.ts with lesson content
// import { adhsWorkingSections } from './data/adhs-working';

export const codebases: Codebase[] = [
  {
    id: 'adhs-working',
    name: 'ADHS ETL Pipeline',
    description: 'ETL pipeline for processing Arizona Department of Health Services provider datasets with multi-stage enrichment',
    language: 'Python',
    githubUrl: 'https://github.com/odgsully/adhs-working',
    techStack: ['Python 3.11', 'Poetry', 'Pandas', 'Typer CLI', 'Selenium', 'RapidFuzz'],
    sections: [], // TODO: Add adhsWorkingSections when data file is created
    isImplemented: false, // Set to true once lesson content is added
  },
  {
    id: 'actual',
    name: 'Actual (Wabbit Monorepo)',
    description: 'Full-stack monorepo containing Wabbit real estate apps, GS Site dashboard, and property scraping systems',
    language: 'TypeScript',
    githubUrl: 'https://github.com/odgsully/Actual',
    techStack: ['Next.js 14', 'React 18', 'TypeScript', 'Supabase', 'Tailwind CSS'],
    sections: [],
    isImplemented: false,
  },
  {
    id: 'benchmark',
    name: 'Benchmark',
    description: 'Performance benchmarking utilities and comparison tools',
    language: 'TypeScript',
    githubUrl: 'https://github.com/odgsully/benchmark',
    techStack: ['TypeScript', 'Node.js'],
    sections: [],
    isImplemented: false,
  },
  {
    id: 'tac-4',
    name: 'TAC-4',
    description: 'Python project for data analysis and automation',
    language: 'Python',
    githubUrl: 'https://github.com/odgsully/tac-4',
    techStack: ['Python'],
    sections: [],
    isImplemented: false,
  },
  {
    id: 'tac-5',
    name: 'TAC-5',
    description: 'Python project for data analysis and automation',
    language: 'Python',
    githubUrl: 'https://github.com/odgsully/tac-5',
    techStack: ['Python'],
    sections: [],
    isImplemented: false,
  },
  {
    id: 'financial-econ',
    name: 'Financial-Econ',
    description: 'Financial and economic analysis tools',
    language: 'Python',
    githubUrl: 'https://github.com/odgsully/Financial-Econ',
    techStack: ['Python', 'Pandas', 'NumPy'],
    sections: [],
    isImplemented: false,
  },
  {
    id: 'youtube-monitor',
    name: 'YouTubeMonitor',
    description: 'YouTube channel and video monitoring system',
    language: 'Python',
    githubUrl: 'https://github.com/odgsully/YouTubeMonitor',
    techStack: ['Python', 'YouTube API'],
    sections: [],
    isImplemented: false,
  },
  {
    id: 'jarvis-briefme',
    name: 'Jarvis_BriefMe',
    description: 'AI-powered daily briefing and summarization system',
    language: 'Python',
    githubUrl: 'https://github.com/odgsully/Jarvis_BriefMe',
    techStack: ['Python', 'OpenAI API'],
    sections: [],
    isImplemented: false,
  },
];

export function getCodebase(id: string): Codebase | undefined {
  return codebases.find((cb) => cb.id === id);
}

export function getImplementedCodebases(): Codebase[] {
  return codebases.filter((cb) => cb.isImplemented);
}

export function getAllCodebases(): Codebase[] {
  return codebases;
}
