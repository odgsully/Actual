'use client';

import { useState } from 'react';
import { useTiles } from '@/hooks/useTiles';
import type { Tile } from '@/lib/types/tiles';
import {
  Settings,
  Search,
  ChevronRight,
  Calendar,
  Type,
  Hash,
  Palette,
  List,
  Mail,
  Link as LinkIcon,
} from 'lucide-react';
import Link from 'next/link';

// Configurable tiles from docs/GO-PLAN.md
const CONFIGURABLE_TILES = [
  {
    id: 'realtyone-events',
    name: '10. RealtyOne Events button',
    setting: 'Modify Notion link',
    settingType: 'url',
    icon: LinkIcon,
  },
  {
    id: 'days-till-counter',
    name: '13. Panel for Days Till…',
    setting: 'Target date',
    settingType: 'date',
    icon: Calendar,
  },
  {
    id: 'eating-challenges',
    name: '5. Create Eating Challenges',
    setting: 'Inventory list',
    settingType: 'textarea',
    icon: List,
  },
  {
    id: 'codebase-duolingo',
    name: 'Codebase Duolingo',
    setting: 'Difficulty 1-3',
    settingType: 'slider',
    icon: Hash,
  },
  {
    id: 'days-since-bloodwork',
    name: 'Bloodwork',
    setting: 'Start date',
    settingType: 'date',
    icon: Calendar,
  },
  {
    id: 'morning-form',
    name: 'Morning Form',
    setting: 'Video duration',
    settingType: 'number',
    icon: Hash,
  },
  {
    id: 'memento-morri',
    name: 'Memento Morri',
    setting: 'Color toggle',
    settingType: 'color',
    icon: Palette,
  },
  {
    id: 'random-contact',
    name: '2. Random Daily Contact',
    setting: 'CRM tags toggle',
    settingType: 'multiselect',
    icon: List,
  },
  {
    id: 'accountability-report',
    name: 'Accountability Report',
    setting: 'Circle emails, frequency',
    settingType: 'complex',
    icon: Mail,
  },
];

function getSettingTypeLabel(type: string) {
  switch (type) {
    case 'url':
      return 'URL';
    case 'date':
      return 'Date';
    case 'textarea':
      return 'Text';
    case 'slider':
      return 'Range';
    case 'number':
      return 'Number';
    case 'color':
      return 'Color';
    case 'multiselect':
      return 'Multi-select';
    case 'complex':
      return 'Multiple';
    default:
      return type;
  }
}

export default function TilesSettingsPage() {
  const { tiles, isLoading } = useTiles();
  const [search, setSearch] = useState('');

  // Filter configurable tiles by search
  const filteredTiles = CONFIGURABLE_TILES.filter(
    (tile) =>
      tile.name.toLowerCase().includes(search.toLowerCase()) ||
      tile.setting.toLowerCase().includes(search.toLowerCase())
  );

  // Get matching Notion tile data
  const getTileData = (name: string) => {
    return tiles?.find(
      (t: Tile) => t.name.toLowerCase().includes(name.toLowerCase().split('.')[1]?.trim() || name.toLowerCase())
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Tile Settings</h1>
        <p className="text-muted-foreground">
          Configure settings for tiles with customizable options
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search tiles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Configurable Tiles List */}
      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurable Tiles ({filteredTiles.length})
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            These tiles have user-configurable settings
          </p>
        </div>

        {filteredTiles.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No tiles match your search
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredTiles.map((tile) => {
              const Icon = tile.icon;
              const notionTile = getTileData(tile.name);

              return (
                <Link
                  key={tile.id}
                  href={`/admin/tiles/${tile.id}`}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{tile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {tile.setting}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="px-2 py-1 text-xs rounded bg-muted">
                      {getSettingTypeLabel(tile.settingType)}
                    </span>
                    {notionTile && (
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          notionTile.status === 'Done'
                            ? 'bg-green-500/10 text-green-600'
                            : notionTile.status === 'In progress'
                            ? 'bg-blue-500/10 text-blue-600'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {notionTile.status}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* All Tiles Section */}
      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold">All Tiles Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">
            View all {tiles?.length ?? 0} tiles from Notion database
          </p>
        </div>

        {isLoading ? (
          <div className="p-8">
            <div className="space-y-2 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded" />
              ))}
            </div>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto divide-y divide-border">
            {tiles
              ?.filter(
                (t: Tile) =>
                  t.name.toLowerCase().includes(search.toLowerCase()) ||
                  t.desc?.toLowerCase().includes(search.toLowerCase())
              )
              .slice(0, 20)
              .map((tile: Tile) => (
                <div
                  key={tile.id}
                  className="flex items-center justify-between p-3 text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{tile.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {tile.desc || 'No description'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {tile.actionWarning && (
                      <span className="px-1.5 py-0.5 text-[10px] rounded bg-yellow-500/10 text-yellow-600">
                        Warning
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${
                        tile.status === 'Done'
                          ? 'bg-green-500/10 text-green-600'
                          : tile.status === 'In progress'
                          ? 'bg-blue-500/10 text-blue-600'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {tile.status}
                    </span>
                  </div>
                </div>
              ))}
            {tiles && tiles.length > 20 && (
              <div className="p-3 text-center text-sm text-muted-foreground">
                Showing 20 of {tiles.length} tiles
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
