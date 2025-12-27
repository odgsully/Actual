'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Plug,
  Grid3X3,
  Heart,
  ArrowLeft,
  Settings,
} from 'lucide-react';
import { useAllConnectionsHealth } from '@/hooks/useConnectionHealth';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | boolean;
}

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg text-sm
        transition-colors duration-150
        ${isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }
      `}
    >
      {item.icon}
      <span>{item.label}</span>
      {item.badge && (
        <span className="ml-auto w-2 h-2 rounded-full bg-red-500" />
      )}
    </Link>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { summary, isLoading } = useAllConnectionsHealth();

  const hasDisconnected = summary.disconnected.length > 0;

  const navItems: NavItem[] = [
    {
      href: '/admin',
      label: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      href: '/admin/connections',
      label: 'Connections',
      icon: <Plug className="w-4 h-4" />,
      badge: hasDisconnected,
    },
    {
      href: '/admin/tiles',
      label: 'Tile Settings',
      icon: <Grid3X3 className="w-4 h-4" />,
    },
    {
      href: '/admin/health',
      label: 'System Health',
      icon: <Heart className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Dashboard</span>
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold">GS Site Admin</span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-56 border-r border-border p-4">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                isActive={
                  item.href === '/admin'
                    ? pathname === '/admin'
                    : pathname.startsWith(item.href)
                }
              />
            ))}
          </nav>

          {/* Connection Status Summary */}
          <div className="mt-8 pt-4 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Quick Status
            </p>
            {isLoading ? (
              <div className="space-y-1 animate-pulse">
                <div className="h-3 w-24 bg-muted rounded" />
                <div className="h-3 w-20 bg-muted rounded" />
              </div>
            ) : (
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span>{summary.connected.length} connected</span>
                </div>
                {summary.disconnected.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span>{summary.disconnected.length} disconnected</span>
                  </div>
                )}
                {summary.comingSoon.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span>{summary.comingSoon.length} coming soon</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 pb-16">{children}</main>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-background/50">
        <div className="flex items-center justify-center gap-4 px-4 py-3 text-xs text-muted-foreground">
          <span>GS Dashboard</span>
          <span className="text-border">•</span>
          <Link
            href="/privacy"
            className="hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}
