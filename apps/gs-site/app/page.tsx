'use client';

import { useState, useMemo } from 'react';
import Link from "next/link";
import {
  Database,
  Rabbit,
  ListTodo,
  Heart,
  Printer,
  Calendar as CalendarIcon,
  ExternalLink,
  Upload,
  Youtube,
  Activity,
  FileText,
  LayoutGrid,
  Sparkles,
  Zap,
  Code,
  Github,
  Brain,
  Timer,
  PieChart,
  MessageSquare,
  Utensils,
  LineChart,
  Users,
  Folder,
  CircleDot,
  GraduationCap,
  Skull,
  Send,
  Camera,
  Sunrise,
  Settings
} from "lucide-react";
import { MenuFilter, type MenuCategory } from '@/components/MenuFilter';

type TileType = 'link' | 'upload' | 'calendar' | 'dashboard' | 'action';

interface DashboardTile {
  id: string;
  title: string;
  type: TileType;
  href?: string;
  external?: boolean;
  icon: React.ReactNode;
  description?: string;
  menu: MenuCategory[];
  status?: 'Not started' | 'In progress' | 'Done';
}

const tiles: DashboardTile[] = [
  // Real Estate
  {
    id: 'crm',
    title: 'CRM',
    type: 'link',
    href: '/crm',
    icon: <Database className="w-5 h-5" />,
    description: 'gsrealty-client site',
    menu: ['Real Estate'],
    status: 'Not started'
  },
  {
    id: 'open-house-todo',
    title: 'Open House To-Do',
    type: 'action',
    icon: <ListTodo className="w-5 h-5" />,
    description: 'Form checklist',
    menu: ['Real Estate'],
    status: 'In progress'
  },
  {
    id: 'gs-clients-admin',
    title: 'GS-clients Admin',
    type: 'link',
    href: '#gs-clients-admin',
    icon: <Settings className="w-5 h-5" />,
    description: 'Admin dashboard',
    menu: ['Real Estate', 'Software'],
    status: 'Not started'
  },
  {
    id: 'realtyone-kpis',
    title: 'RealtyOne KPIs',
    type: 'dashboard',
    icon: <LineChart className="w-5 h-5" />,
    description: 'Commission calculator',
    menu: ['Real Estate'],
    status: 'Not started'
  },
  {
    id: 'call-tree',
    title: 'Call tree Launch',
    type: 'action',
    icon: <Users className="w-5 h-5" />,
    description: 'IF/THEN agent training',
    menu: ['Real Estate', 'Org'],
    status: 'Not started'
  },

  // Software
  {
    id: 'wab-tasklist',
    title: 'Wab: Task List',
    type: 'link',
    href: 'http://localhost:3000/rank-feed?rank=0-3',
    external: true,
    icon: <ListTodo className="w-5 h-5" />,
    description: 'Rank 0-3',
    menu: ['Software'],
    status: 'Not started'
  },
  {
    id: 'new-gs-wab',
    title: 'New GS Wab',
    type: 'link',
    href: 'http://localhost:3000',
    external: true,
    icon: <Rabbit className="w-5 h-5" />,
    description: 'Auto sign-in',
    menu: ['Software'],
    status: 'Not started'
  },
  {
    id: 'my-wabbit',
    title: 'Go to my Wabbit',
    type: 'link',
    href: 'http://localhost:3002',
    external: true,
    icon: <Rabbit className="w-5 h-5" />,
    description: 'Personal ranking',
    menu: ['Software'],
    status: 'Not started'
  },
  {
    id: 'llm-arena',
    title: 'LLM Arena',
    type: 'link',
    href: 'https://lmarena.ai',
    external: true,
    icon: <Brain className="w-5 h-5" />,
    description: 'Model comparison',
    menu: ['Software'],
    status: 'Not started'
  },
  {
    id: 'prime-cc',
    title: '/prime-cc',
    type: 'action',
    icon: <Code className="w-5 h-5" />,
    description: 'Codebase improvements',
    menu: ['Software', 'Org'],
    status: 'Not started'
  },
  {
    id: 'tools',
    title: '/tools',
    type: 'action',
    icon: <Zap className="w-5 h-5" />,
    description: 'Custom commands',
    menu: ['Software', 'Org'],
    status: 'Not started'
  },
  {
    id: 'github-api',
    title: 'GitHub API',
    type: 'action',
    icon: <Github className="w-5 h-5" />,
    description: 'AZ repo search',
    menu: ['Software'],
    status: 'Not started'
  },
  {
    id: 'questioning-agent',
    title: 'Daniel Park Agent',
    type: 'action',
    icon: <MessageSquare className="w-5 h-5" />,
    description: 'Questioning agent',
    menu: ['Software'],
    status: 'Not started'
  },
  {
    id: 'idp-datadog',
    title: 'IDP Datadog',
    type: 'dashboard',
    icon: <Activity className="w-5 h-5" />,
    description: 'Pipeline health',
    menu: ['Software'],
    status: 'Not started'
  },
  {
    id: 'claude-usage',
    title: 'Claude Usage',
    type: 'dashboard',
    icon: <Brain className="w-5 h-5" />,
    description: 'Token usage',
    menu: ['Software'],
    status: 'Not started'
  },
  {
    id: 'github-commits',
    title: 'GitHub Commits',
    type: 'dashboard',
    icon: <Github className="w-5 h-5" />,
    description: 'Annual count',
    menu: ['Software'],
    status: 'Not started'
  },
  {
    id: 'ai-workforce',
    title: 'AI Workforce',
    type: 'link',
    href: '#ai-workforce',
    icon: <Users className="w-5 h-5" />,
    description: 'Agent admin',
    menu: ['Software', 'Org'],
    status: 'Not started'
  },
  {
    id: 'odgsully-repos',
    title: 'odgsully Repos',
    type: 'link',
    href: 'https://github.com/odgsully',
    external: true,
    icon: <Github className="w-5 h-5" />,
    description: 'GitHub profile',
    menu: ['Software'],
    status: 'Not started'
  },

  // Org
  {
    id: 'gs-admin-view',
    title: 'GS Site Admin',
    type: 'link',
    href: '#admin',
    icon: <Settings className="w-5 h-5" />,
    description: 'Logic variables',
    menu: ['Org'],
    status: 'Not started'
  },
  {
    id: 'print-daily',
    title: 'Print DAILY',
    type: 'action',
    href: '#trigger-daily',
    icon: <Printer className="w-5 h-5" />,
    description: 'Tomorrow workflow',
    menu: ['Org'],
    status: 'Not started'
  },
  {
    id: 'print-weekly',
    title: 'Print WEEKLIES',
    type: 'action',
    href: '#trigger-weekly',
    icon: <FileText className="w-5 h-5" />,
    description: 'Weekly workflow',
    menu: ['Org'],
    status: 'Not started'
  },
  {
    id: 'forms-monthly',
    title: 'Forms Monthly',
    type: 'action',
    icon: <FileText className="w-5 h-5" />,
    description: 'Monthly KPIs',
    menu: ['Org'],
    status: 'Not started'
  },
  {
    id: 'forms-quarterly',
    title: 'Forms Quarterly',
    type: 'action',
    icon: <FileText className="w-5 h-5" />,
    description: 'Quarterly KPIs',
    menu: ['Org'],
    status: 'Not started'
  },
  {
    id: 'forms-streak',
    title: 'Forms Streak',
    type: 'dashboard',
    icon: <Zap className="w-5 h-5" />,
    description: 'Min 2x/day',
    menu: ['Org', 'Health'],
    status: 'Not started'
  },
  {
    id: 'forms-count',
    title: 'Forms Count',
    type: 'dashboard',
    icon: <ListTodo className="w-5 h-5" />,
    description: 'This week',
    menu: ['Org'],
    status: 'Not started'
  },
  {
    id: 'time-spent',
    title: 'Time Spent',
    type: 'dashboard',
    icon: <PieChart className="w-5 h-5" />,
    description: 'Pie charts',
    menu: ['Org'],
    status: 'Not started'
  },
  {
    id: 'non-google-form',
    title: 'Non-Google Form',
    type: 'action',
    icon: <FileText className="w-5 h-5" />,
    description: 'Supabase + whisper',
    menu: ['Org'],
    status: 'Not started'
  },
  {
    id: 'icloud-folders',
    title: 'iCloud Folders',
    type: 'dashboard',
    icon: <Folder className="w-5 h-5" />,
    description: 'Unplaced count',
    menu: ['Org'],
    status: 'Not started'
  },
  {
    id: 'recurring-dots',
    title: 'Recurring Tasks',
    type: 'dashboard',
    icon: <CircleDot className="w-5 h-5" />,
    description: 'Monthly dots',
    menu: ['Org'],
    status: 'Not started'
  },
  {
    id: 'accountability',
    title: 'Accountability',
    type: 'action',
    icon: <Send className="w-5 h-5" />,
    description: 'Circle report',
    menu: ['Org'],
    status: 'Not started'
  },
  {
    id: 'task-wabbed',
    title: 'Task Wabbed %',
    type: 'dashboard',
    icon: <PieChart className="w-5 h-5" />,
    description: 'Weekly toggle',
    menu: ['Org'],
    status: 'Not started'
  },
  {
    id: 'cali-tasklist',
    title: 'Cali Task List',
    type: 'dashboard',
    icon: <ListTodo className="w-5 h-5" />,
    description: 'Grades [A,B+,B,B-,C+]',
    menu: ['Org'],
    status: 'Not started'
  },
  {
    id: 'morning-form',
    title: 'Morning Form',
    type: 'action',
    icon: <Sunrise className="w-5 h-5" />,
    description: 'AM check-in',
    menu: ['Org'],
    status: 'Not started'
  },
  {
    id: 'habitat-pic',
    title: 'Habitat Pic',
    type: 'upload',
    icon: <Camera className="w-5 h-5" />,
    description: 'Environment check',
    menu: ['Org', 'Health'],
    status: 'Not started'
  },

  // Content
  {
    id: 'epsn3-bin',
    title: 'EPSN3 Bin',
    type: 'upload',
    icon: <Upload className="w-5 h-5" />,
    description: 'Upload file',
    menu: ['Content'],
    status: 'Not started'
  },
  {
    id: 'gs-scheduler',
    title: 'GS Scheduler',
    type: 'calendar',
    icon: <CalendarIcon className="w-5 h-5" />,
    description: 'Posts calendar',
    menu: ['Content'],
    status: 'Not started'
  },
  {
    id: 'youtube-wrapper',
    title: 'YouTube Timeline',
    type: 'action',
    icon: <Youtube className="w-5 h-5" />,
    description: 'Transcript analysis',
    menu: ['Content'],
    status: 'Not started'
  },
  {
    id: 'socials-stats',
    title: 'Socials Stats',
    type: 'dashboard',
    icon: <LineChart className="w-5 h-5" />,
    description: 'YouTube & X',
    menu: ['Content'],
    status: 'Not started'
  },
  {
    id: 'days-till',
    title: 'Days Till...',
    type: 'dashboard',
    icon: <Timer className="w-5 h-5" />,
    description: 'Space Ad countdown',
    menu: ['Content', 'Org'],
    status: 'Not started'
  },

  // Health
  {
    id: 'whoop-insights',
    title: 'Whoop Insights',
    type: 'dashboard',
    icon: <Activity className="w-5 h-5" />,
    description: 'API dashboard',
    menu: ['Health', 'Org'],
    status: 'Not started'
  },
  {
    id: 'bloodwork',
    title: 'Bloodwork Counter',
    type: 'dashboard',
    icon: <Timer className="w-5 h-5" />,
    description: 'Days since',
    menu: ['Health'],
    status: 'Not started'
  },
  {
    id: 'eating-challenges',
    title: 'Eating Challenges',
    type: 'action',
    icon: <Utensils className="w-5 h-5" />,
    description: 'Inventory recipes',
    menu: ['Health', 'Content'],
    status: 'Not started'
  },
  {
    id: 'health-tracker',
    title: 'Health Tracker',
    type: 'dashboard',
    icon: <LineChart className="w-5 h-5" />,
    description: 'Chart view',
    menu: ['Health', 'Org'],
    status: 'Not started'
  },
  {
    id: 'random-contact',
    title: 'Random Contact',
    type: 'action',
    icon: <Users className="w-5 h-5" />,
    description: 'Apple contacts',
    menu: ['Health', 'Real Estate', 'Software'],
    status: 'Not started'
  },
  {
    id: 'habits-streaks',
    title: 'Habits STREAKS',
    type: 'dashboard',
    icon: <Zap className="w-5 h-5" />,
    description: 'Day count',
    menu: ['Health', 'Org'],
    status: 'Not started'
  },
  {
    id: 'memento-morri',
    title: 'Memento Morri',
    type: 'action',
    icon: <Skull className="w-5 h-5" />,
    description: 'Weeks remaining',
    menu: ['Health'],
    status: 'Not started'
  },

  // Learn
  {
    id: 'yc-invites',
    title: 'YC Invites',
    type: 'dashboard',
    icon: <GraduationCap className="w-5 h-5" />,
    description: '0/20 remaining',
    menu: ['Learn'],
    status: 'Not started'
  },
  {
    id: 'jarvis-briefme',
    title: 'Jarvis Briefme',
    type: 'action',
    icon: <Brain className="w-5 h-5" />,
    description: 'URL transcribe',
    menu: ['Learn'],
    status: 'Not started'
  },

  // Multi-category utilities
  {
    id: 'natural-sql',
    title: 'Natural SQL',
    type: 'action',
    icon: <Database className="w-5 h-5" />,
    description: 'Query all DBs',
    menu: ['Real Estate', 'Software', 'Org', 'Content', 'Health'],
    status: 'Not started'
  },
  {
    id: 'phase-form',
    title: 'Phase Form',
    type: 'action',
    icon: <CalendarIcon className="w-5 h-5" />,
    description: '2-week poll',
    menu: ['Real Estate', 'Software', 'Org', 'Content', 'Health'],
    status: 'Not started'
  },

  // UI Libraries (Done)
  {
    id: 'ui-libraries',
    title: 'UI LIBRARIES',
    type: 'link',
    href: '/examples',
    icon: <LayoutGrid className="w-5 h-5" />,
    description: 'Component demos',
    menu: ['Org'],
    status: 'Done'
  },
  {
    id: 'cult-ui',
    title: 'CultUI',
    type: 'link',
    href: '/ui-libraries/cult-ui',
    icon: <Sparkles className="w-5 h-5" />,
    description: '48+ animated',
    menu: ['Org'],
    status: 'Done'
  },
  {
    id: 'motion-primitives',
    title: 'Motion-Primitives',
    type: 'link',
    href: '/ui-libraries/motion-primitives',
    icon: <Zap className="w-5 h-5" />,
    description: '30+ effects',
    menu: ['Org'],
    status: 'Done'
  }
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<MenuCategory>('ALL');

  const filteredTiles = useMemo(() => {
    if (activeCategory === 'ALL') return tiles;
    return tiles.filter((tile) => tile.menu.includes(activeCategory));
  }, [activeCategory]);

  const tileCounts = useMemo(() => {
    const counts: Record<MenuCategory, number> = {
      'ALL': tiles.length,
      'Real Estate': 0,
      'Software': 0,
      'Org': 0,
      'Content': 0,
      'Health': 0,
      'Learn': 0,
    };
    tiles.forEach((tile) => {
      tile.menu.forEach((cat) => {
        if (cat in counts) counts[cat]++;
      });
    });
    return counts;
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-lg font-medium text-foreground tracking-tight">
            GS Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 tracking-wide uppercase">
            Personal App Suite
          </p>
        </div>
      </header>

      {/* Menu Filter */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-6xl mx-auto">
          <MenuFilter
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
          <div className="text-center pb-3 text-xs text-muted-foreground">
            Showing {filteredTiles.length} of {tiles.length} tiles
            {activeCategory !== 'ALL' && (
              <span className="ml-2">
                ({tileCounts[activeCategory]} in {activeCategory})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Tile Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredTiles.map((tile) => (
            <TileCard key={tile.id} tile={tile} />
          ))}
        </div>

        {filteredTiles.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No tiles in this category
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <p className="text-xs text-muted-foreground text-center tracking-wide">
            GS Site 2025
          </p>
        </div>
      </footer>
    </div>
  );
}

function TileCard({ tile }: { tile: DashboardTile }) {
  const statusColors = {
    'Not started': 'bg-muted',
    'In progress': 'bg-blue-500/20 border-blue-500/30',
    'Done': 'bg-green-500/20 border-green-500/30'
  };

  const baseClasses = `
    group
    relative
    flex flex-col
    p-4
    h-28
    bg-card
    border border-border
    hover:bg-accent
    hover:border-muted-foreground/30
    transition-all duration-150
    cursor-pointer
    rounded-lg
    ${tile.status === 'Done' ? 'opacity-60' : ''}
  `;

  const content = (
    <>
      {/* Status indicator */}
      {tile.status && tile.status !== 'Not started' && (
        <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
          tile.status === 'In progress' ? 'bg-blue-500' : 'bg-green-500'
        }`} />
      )}

      <div className="flex items-center justify-between mb-2">
        <span className="text-muted-foreground group-hover:text-foreground transition-colors">
          {tile.icon}
        </span>
        {tile.external && (
          <ExternalLink className="w-3 h-3 text-muted-foreground opacity-50" />
        )}
        {tile.type === 'upload' && (
          <Upload className="w-3 h-3 text-muted-foreground opacity-50" />
        )}
        {tile.type === 'calendar' && (
          <CalendarIcon className="w-3 h-3 text-muted-foreground opacity-50" />
        )}
        {tile.type === 'dashboard' && (
          <Activity className="w-3 h-3 text-muted-foreground opacity-50" />
        )}
      </div>
      <div className="flex-1 flex flex-col justify-end">
        <h3 className="text-sm font-medium text-foreground leading-tight">
          {tile.title}
        </h3>
        {tile.description && (
          <p className="text-xs text-muted-foreground mt-1 tracking-wide truncate">
            {tile.description}
          </p>
        )}
      </div>

      {/* Category tags */}
      {tile.menu.length > 1 && (
        <div className="absolute bottom-1 right-1 flex gap-0.5">
          {tile.menu.slice(0, 3).map((cat, i) => (
            <div
              key={cat}
              className="w-1.5 h-1.5 rounded-full opacity-50"
              style={{
                backgroundColor:
                  cat === 'Real Estate' ? '#f97316' :
                  cat === 'Software' ? '#3b82f6' :
                  cat === 'Org' ? '#8b5cf6' :
                  cat === 'Content' ? '#ef4444' :
                  cat === 'Health' ? '#22c55e' :
                  '#ec4899'
              }}
              title={cat}
            />
          ))}
        </div>
      )}
    </>
  );

  if (tile.type === 'link' && tile.href) {
    if (tile.external) {
      return (
        <a
          href={tile.href}
          target="_blank"
          rel="noopener noreferrer"
          className={baseClasses}
        >
          {content}
        </a>
      );
    }
    return (
      <Link href={tile.href} className={baseClasses}>
        {content}
      </Link>
    );
  }

  return (
    <div className={baseClasses}>
      {content}
    </div>
  );
}
