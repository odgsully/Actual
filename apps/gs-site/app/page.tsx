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
  Zap
} from "lucide-react";

type TileType = 'link' | 'upload' | 'calendar' | 'dashboard';

interface DashboardTile {
  id: string;
  title: string;
  type: TileType;
  href?: string;
  external?: boolean;
  icon: React.ReactNode;
  description?: string;
}

const tiles: DashboardTile[] = [
  {
    id: 'crm-adhs',
    title: 'CRM/ADHS',
    type: 'link',
    href: '/crm',
    icon: <Database className="w-5 h-5" />,
    description: 'Customer database'
  },
  {
    id: 'new-gs-wab',
    title: 'New GS Wab',
    type: 'link',
    href: 'http://localhost:3000',
    external: true,
    icon: <Rabbit className="w-5 h-5" />,
    description: 'Auto sign-in'
  },
  {
    id: 'wab-tasklist',
    title: 'Wab: Task List',
    type: 'link',
    href: 'http://localhost:3000/rank-feed?rank=0-3',
    external: true,
    icon: <ListTodo className="w-5 h-5" />,
    description: 'Rank 0-3'
  },
  {
    id: 'wab-favorites',
    title: 'Wab: Favorites',
    type: 'link',
    href: 'http://localhost:3000/list-view?filter=favorites',
    external: true,
    icon: <Heart className="w-5 h-5" />,
    description: 'Saved items'
  },
  {
    id: 'print-daily',
    title: 'Print DAILY',
    type: 'link',
    href: '#trigger-daily',
    icon: <Printer className="w-5 h-5" />,
    description: 'Tomorrow workflow'
  },
  {
    id: 'print-weekly',
    title: 'Print WEEKLIES',
    type: 'link',
    href: '#trigger-weekly',
    icon: <FileText className="w-5 h-5" />,
    description: 'Weekly workflow'
  },
  {
    id: 'my-wabbit',
    title: 'Go to my Wabbit',
    type: 'link',
    href: 'http://localhost:3002',
    external: true,
    icon: <Rabbit className="w-5 h-5" />,
    description: 'Personal ranking'
  },
  {
    id: 'epsn3-bin',
    title: 'EPSN3 Bin',
    type: 'upload',
    icon: <Upload className="w-5 h-5" />,
    description: 'Upload file'
  },
  {
    id: 'gs-scheduler',
    title: 'GS Scheduler',
    type: 'calendar',
    icon: <CalendarIcon className="w-5 h-5" />,
    description: 'Calendar view'
  },
  {
    id: 'youtube-wrapper',
    title: 'YouTube Timeline',
    type: 'link',
    href: '#youtube-timeline',
    icon: <Youtube className="w-5 h-5" />,
    description: 'Video wrapper'
  },
  {
    id: 'whoop-insights',
    title: 'Whoop Insights',
    type: 'dashboard',
    icon: <Activity className="w-5 h-5" />,
    description: 'API dashboard'
  },
  {
    id: 'shadcn-examples',
    title: 'UI Examples',
    type: 'link',
    href: '/examples',
    icon: <LayoutGrid className="w-5 h-5" />,
    description: 'shadcn/ui demos'
  },
  {
    id: 'cult-ui',
    title: 'CultUI',
    type: 'link',
    href: '/ui-libraries/cult-ui',
    icon: <Sparkles className="w-5 h-5" />,
    description: '48+ animated components'
  },
  {
    id: 'motion-primitives',
    title: 'Motion-Primitives',
    type: 'link',
    href: '/ui-libraries/motion-primitives',
    icon: <Zap className="w-5 h-5" />,
    description: '30+ animation effects'
  }
];

export default function Home() {
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

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Tile Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {tiles.map((tile) => (
            <TileCard key={tile.id} tile={tile} />
          ))}
        </div>
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
  const baseClasses = `
    group
    flex flex-col
    p-4
    h-28
    bg-card
    border border-border
    hover:bg-accent
    hover:border-muted-foreground/30
    transition-colors duration-150
    cursor-pointer
  `;

  const content = (
    <>
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
          <p className="text-xs text-muted-foreground mt-1 tracking-wide">
            {tile.description}
          </p>
        )}
      </div>
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
