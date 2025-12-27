'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import {
  useTileSettings,
  TileSettingKey,
  TileSettingsMap,
  DEFAULT_SETTINGS,
} from '@/lib/admin/tile-settings';
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Calendar,
  Link as LinkIcon,
  Hash,
  Palette,
  List,
  Mail,
  Type,
  Check,
  AlertCircle,
  Users,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { Slider } from '@/components/ui/slider';
import ContactTierManager from '@/components/admin/ContactTierManager';

// Tile metadata for display
const TILE_META: Record<
  TileSettingKey,
  {
    name: string;
    description: string;
    icon: typeof Calendar;
    settingType: string;
  }
> = {
  'realtyone-events': {
    name: 'RE Events',
    description: 'Configure the Notion link for RealtyOne events calendar',
    icon: LinkIcon,
    settingType: 'url',
  },
  'days-till-counter': {
    name: 'SpaceAd',
    description: 'Set the target date and label for the countdown',
    icon: Calendar,
    settingType: 'date',
  },
  'eating-challenges': {
    name: 'Create Eating Challenges',
    description: 'Manage your food inventory list for challenges',
    icon: List,
    settingType: 'textarea',
  },
  'codebase-duolingo': {
    name: 'Codebase Duolingo',
    description: 'Set the difficulty level (1-3) for code challenges',
    icon: Hash,
    settingType: 'slider',
  },
  'days-since-bloodwork': {
    name: 'Days since bloodwork done Counter',
    description: 'Set the date of your last bloodwork',
    icon: Calendar,
    settingType: 'date',
  },
  'morning-form': {
    name: 'Morning Form',
    description: 'Configure the video duration for morning routine',
    icon: Hash,
    settingType: 'number',
  },
  'memento-morri': {
    name: 'Memento Morri',
    description: 'Choose the color scheme for the tile',
    icon: Palette,
    settingType: 'color',
  },
  'random-contact': {
    name: 'Random Daily Contact',
    description: 'Select which CRM tags to include in random selection',
    icon: List,
    settingType: 'multiselect',
  },
  'accountability-report': {
    name: 'Accountability Report send-off to Circle',
    description: 'Configure accountability circle emails and report frequency',
    icon: Mail,
    settingType: 'complex',
  },
};

// Available CRM tags for random contact
const CRM_TAGS = [
  'client',
  'lead',
  'partner',
  'friend',
  'family',
  'vendor',
  'prospect',
  'investor',
];

// Frequency options for accountability report
const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export default function TileSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const tileId = params.tileId as TileSettingKey;

  // Check if valid tile ID
  const isValidTile = tileId in TILE_META;
  const meta = isValidTile ? TILE_META[tileId] : null;

  // Hook for settings (only call if valid tile)
  const { settings, updateSettings, reset, isLoading } = useTileSettings(
    isValidTile ? tileId : 'days-till-counter' // fallback to prevent hook error
  );

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [localSettings, setLocalSettings] = useState<TileSettingsMap[TileSettingKey] | null>(null);

  // Initialize local settings when loaded
  useEffect(() => {
    if (!isLoading && settings) {
      setLocalSettings(settings);
    }
  }, [isLoading, settings]);

  // Handle save
  const handleSave = async () => {
    if (!localSettings) return;

    setSaveStatus('saving');
    try {
      updateSettings(localSettings as Partial<TileSettingsMap[TileSettingKey]>);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Handle reset
  const handleReset = () => {
    if (confirm('Reset all settings to defaults?')) {
      reset();
      setLocalSettings(DEFAULT_SETTINGS[tileId]);
    }
  };

  // Update local settings helper - simplified to avoid complex generics
  const updateLocal = (key: string, value: unknown) => {
    setLocalSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  if (!isValidTile) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/tiles"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to tiles
        </Link>

        <div className="p-8 text-center rounded-lg border border-destructive/50 bg-destructive/10">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Tile Not Found</h2>
          <p className="text-muted-foreground">
            The tile &quot;{tileId}&quot; is not a configurable tile.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || !localSettings) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="h-48 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  const Icon = meta!.icon;

  // Use wider container for accountability-report due to 3-column tier manager
  const containerClass = tileId === 'accountability-report'
    ? 'space-y-6 max-w-6xl'
    : 'space-y-6 max-w-2xl';

  return (
    <div className={containerClass}>
      {/* Back link */}
      <Link
        href="/admin/tiles"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to tiles
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{meta!.name}</h1>
          <p className="text-muted-foreground">{meta!.description}</p>
        </div>
      </div>

      {/* Settings Form */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-6">
        {/* RealtyOne Events - URL input */}
        {tileId === 'realtyone-events' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Notion Calendar URL</label>
            <input
              type="url"
              value={(localSettings as TileSettingsMap['realtyone-events']).notionUrl}
              onChange={(e) => updateLocal('notionUrl', e.target.value)}
              placeholder="https://notion.so/..."
              className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground">
              Enter the full Notion URL for your RealtyOne events calendar
            </p>
          </div>
        )}

        {/* Days Till Counter - Date picker + label */}
        {tileId === 'days-till-counter' && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Event Label</label>
              <input
                type="text"
                value={(localSettings as TileSettingsMap['days-till-counter']).label}
                onChange={(e) => updateLocal('label', e.target.value)}
                placeholder="e.g., Conference, Vacation, Launch"
                className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Date</label>
              <input
                type="date"
                value={(localSettings as TileSettingsMap['days-till-counter']).targetDate}
                onChange={(e) => updateLocal('targetDate', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </>
        )}

        {/* Eating Challenges - Textarea for inventory */}
        {tileId === 'eating-challenges' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Inventory List</label>
            <textarea
              value={(localSettings as TileSettingsMap['eating-challenges']).inventoryList.join('\n')}
              onChange={(e) =>
                updateLocal('inventoryList', e.target.value.split('\n').filter(Boolean))
              }
              placeholder="Enter each item on a new line..."
              rows={8}
              className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              One item per line. These will be used for eating challenges.
            </p>
          </div>
        )}

        {/* Codebase Duolingo - Difficulty slider */}
        {tileId === 'codebase-duolingo' && (
          <div className="space-y-4">
            <label className="text-sm font-medium">Difficulty Level</label>
            <div className="space-y-4">
              <Slider
                value={[(localSettings as TileSettingsMap['codebase-duolingo']).difficulty]}
                onValueChange={([value]) => updateLocal('difficulty', value)}
                min={1}
                max={3}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Easy (1)</span>
                <span>Medium (2)</span>
                <span>Hard (3)</span>
              </div>
              <p className="text-sm">
                Current: Level{' '}
                <span className="font-bold">
                  {(localSettings as TileSettingsMap['codebase-duolingo']).difficulty}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Days Since Bloodwork - Date picker */}
        {tileId === 'days-since-bloodwork' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Last Bloodwork Date</label>
            <input
              type="date"
              value={(localSettings as TileSettingsMap['days-since-bloodwork']).startDate}
              onChange={(e) => updateLocal('startDate', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground">
              This date will be used to calculate days since last bloodwork
            </p>
          </div>
        )}

        {/* Morning Form - Number input */}
        {tileId === 'morning-form' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Video Duration (seconds)</label>
            <input
              type="number"
              value={(localSettings as TileSettingsMap['morning-form']).videoDurationSeconds}
              onChange={(e) => updateLocal('videoDurationSeconds', parseInt(e.target.value) || 0)}
              min={30}
              max={3600}
              step={30}
              className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground">
              {Math.floor(
                (localSettings as TileSettingsMap['morning-form']).videoDurationSeconds / 60
              )}{' '}
              minutes{' '}
              {(localSettings as TileSettingsMap['morning-form']).videoDurationSeconds % 60
                ? `${(localSettings as TileSettingsMap['morning-form']).videoDurationSeconds % 60} seconds`
                : ''}
            </p>
          </div>
        )}

        {/* Memento Morri - Color picker */}
        {tileId === 'memento-morri' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Tile Color</label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={(localSettings as TileSettingsMap['memento-morri']).color}
                onChange={(e) => updateLocal('color', e.target.value)}
                className="w-16 h-10 rounded cursor-pointer border border-input"
              />
              <input
                type="text"
                value={(localSettings as TileSettingsMap['memento-morri']).color}
                onChange={(e) => updateLocal('color', e.target.value)}
                placeholder="#000000"
                className="flex-1 px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Choose a color for the Memento Morri visualization
            </p>
          </div>
        )}

        {/* Random Contact - Multi-select tags */}
        {tileId === 'random-contact' && (
          <div className="space-y-3">
            <label className="text-sm font-medium">Enabled CRM Tags</label>
            <p className="text-xs text-muted-foreground mb-2">
              Select which tags to include when picking a random contact
            </p>
            <div className="flex flex-wrap gap-2">
              {CRM_TAGS.map((tag) => {
                const isSelected = (
                  localSettings as TileSettingsMap['random-contact']
                ).enabledCrmTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      const current = (localSettings as TileSettingsMap['random-contact'])
                        .enabledCrmTags;
                      const updated = isSelected
                        ? current.filter((t) => t !== tag)
                        : [...current, tag];
                      updateLocal('enabledCrmTags', updated);
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Accountability Report - Complex form */}
        {tileId === 'accountability-report' && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Frequency</label>
              <select
                value={(localSettings as TileSettingsMap['accountability-report']).frequency}
                onChange={(e) => updateLocal('frequency', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {FREQUENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Circle Member Emails</label>
              <textarea
                value={(localSettings as TileSettingsMap['accountability-report']).circleEmails.join(
                  '\n'
                )}
                onChange={(e) =>
                  updateLocal(
                    'circleEmails',
                    e.target.value.split('\n').map((s) => s.trim()).filter(Boolean)
                  )
                }
                placeholder="email1@example.com&#10;email2@example.com"
                rows={4}
                className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                One email per line. Reports will be sent to these addresses.
              </p>
            </div>

            {/* Contact Tier Management Section */}
            <div className="border-t border-border pt-6 mt-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold">Contact Circle Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Assign contacts to tiers for accountability reports. Tier I = Weekly, Tier II = Monthly, Non-circle = Never.
                  </p>
                </div>
              </div>

              <Suspense
                fallback={
                  <div className="rounded-lg border border-border bg-card p-8 flex items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">Loading contact manager...</span>
                  </div>
                }
              >
                <ContactTierManager />
              </Suspense>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to defaults
        </button>

        <button
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className={`inline-flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
            saveStatus === 'saved'
              ? 'bg-green-600 text-white'
              : saveStatus === 'error'
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {saveStatus === 'saving' ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : saveStatus === 'saved' ? (
            <>
              <Check className="w-4 h-4" />
              Saved!
            </>
          ) : saveStatus === 'error' ? (
            <>
              <AlertCircle className="w-4 h-4" />
              Error
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
