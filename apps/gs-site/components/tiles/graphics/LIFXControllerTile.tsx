'use client';

import { useState } from 'react';
import {
  Lightbulb,
  LightbulbOff,
  X,
  Power,
  Sun,
  Palette,
  Sparkles,
  RefreshCw,
  Loader2,
  AlertCircle,
  Lock,
  Moon,
  Sunrise,
} from 'lucide-react';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { Tile } from '@/lib/types/tiles';
import {
  useLIFXController,
  LIFXLight,
  LIFXPresetColor,
  LIFX_PRESET_COLORS,
} from '@/hooks/useLIFXData';

interface LIFXControllerTileProps {
  tile: Tile;
  className?: string;
}

// Color presets for quick selection
const COLOR_PRESETS: { name: LIFXPresetColor; color: string; label: string }[] = [
  // Whites
  { name: 'Warm White', color: '#ffd89b', label: 'Warm' },
  { name: 'Soft White', color: '#ffe4c4', label: 'Soft' },
  { name: 'Neutral White', color: '#fff5e6', label: 'Neutral' },
  { name: 'Cool White', color: '#f5f5ff', label: 'Cool' },
  { name: 'Daylight', color: '#e0e5ff', label: 'Day' },
];

const SCENE_PRESETS: { name: LIFXPresetColor; color: string; label: string }[] = [
  { name: 'Relax', color: '#ffd89b', label: 'Relax' },
  { name: 'Focus', color: '#fff5e6', label: 'Focus' },
  { name: 'Energize', color: '#e0e5ff', label: 'Energy' },
  { name: 'Movie', color: '#ff8c42', label: 'Movie' },
];

const RAINBOW_COLORS: { name: LIFXPresetColor; color: string }[] = [
  { name: 'Red', color: '#ff0000' },
  { name: 'Orange', color: '#ff8c00' },
  { name: 'Yellow', color: '#ffff00' },
  { name: 'Green', color: '#00ff00' },
  { name: 'Cyan', color: '#00ffff' },
  { name: 'Blue', color: '#0000ff' },
  { name: 'Purple', color: '#8b00ff' },
  { name: 'Pink', color: '#ff69b4' },
];

/**
 * Individual light card for the modal
 */
function LightCard({
  light,
  onToggle,
  onBrightness,
  isActing,
}: {
  light: LIFXLight;
  onToggle: () => void;
  onBrightness: (b: number) => void;
  isActing: boolean;
}) {
  const isOn = light.power === 'on';
  const brightnessPercent = Math.round(light.brightness * 100);

  // Convert HSB to approximate hex for display
  const getDisplayColor = () => {
    if (!isOn) return '#333';
    const { kelvin } = light.color;
    // Map kelvin to color for display
    if (kelvin >= 2700 && kelvin < 3500) return '#ffd89b';
    if (kelvin >= 3500 && kelvin < 4500) return '#ffe4c4';
    if (kelvin >= 4500 && kelvin < 5500) return '#fff5e6';
    if (kelvin >= 5500 && kelvin < 6500) return '#f5f5ff';
    return '#e0e5ff';
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border">
      {/* Light indicator */}
      <button
        onClick={onToggle}
        disabled={isActing}
        className={`p-3 rounded-full transition-all ${
          isOn
            ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        }`}
        title={isOn ? 'Turn off' : 'Turn on'}
      >
        {isOn ? (
          <Lightbulb className="w-6 h-6" style={{ color: getDisplayColor() }} />
        ) : (
          <LightbulbOff className="w-6 h-6" />
        )}
      </button>

      {/* Light info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{light.label}</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              isOn ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'
            }`}
          >
            {isOn ? 'On' : 'Off'}
          </span>
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {light.group?.name || 'No group'} • {light.connected ? 'Connected' : 'Offline'}
        </div>
      </div>

      {/* Brightness slider */}
      {isOn && (
        <div className="flex items-center gap-2 w-32">
          <Sun className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="range"
            min="0"
            max="100"
            value={brightnessPercent}
            onChange={(e) => onBrightness(parseInt(e.target.value) / 100)}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-yellow-500"
            disabled={isActing}
          />
          <span className="text-xs text-muted-foreground w-8 text-right">
            {brightnessPercent}%
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * LIFX Controller Modal - Full control interface
 */
function LIFXControllerModal({
  onClose,
  controller,
}: {
  onClose: () => void;
  controller: ReturnType<typeof useLIFXController>;
}) {
  const [activeTab, setActiveTab] = useState<'whites' | 'colors' | 'scenes' | 'effects'>(
    'whites'
  );

  const {
    lights,
    isLoading,
    isActing,
    error,
    anyOn,
    avgBrightness,
    isLocked,
    lockReason,
    lockMessage,
    toggle,
    turnOn,
    turnOff,
    setBrightness,
    setPreset,
    breathe,
    pulse,
    stopEffects,
    refresh,
  } = controller;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-card border border-border rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">LIFX Controller</h2>
              <p className="text-sm text-muted-foreground">
                {lights.length} light{lights.length !== 1 ? 's' : ''} •{' '}
                {lights.filter((l) => l.power === 'on').length} on
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              disabled={isLoading}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive border-b border-border">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Lock status banner */}
        {isLocked && (
          <div className="flex items-center gap-3 p-4 bg-purple-500/20 text-purple-300 border-b border-purple-500/30">
            <div className="p-2 bg-purple-500/30 rounded-full">
              <Lock className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium flex items-center gap-2">
                <Moon className="w-4 h-4" />
                Evening Check-In Required
              </div>
              <p className="text-sm text-purple-300/80 mt-0.5">
                {lockMessage || 'Complete the evening check-in form to unlock lights'}
              </p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && lights.length === 0 && (
          <div className="flex-1 flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Main content */}
        {lights.length > 0 && (
          <>
            {/* Quick controls */}
            <div className="flex items-center justify-between p-4 bg-muted/20 border-b border-border">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggle()}
                  disabled={isActing || (isLocked && anyOn)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    isLocked && anyOn
                      ? 'bg-purple-500/30 text-purple-300 cursor-not-allowed'
                      : anyOn
                        ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                        : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                  title={isLocked && anyOn ? lockMessage || 'Locked' : undefined}
                >
                  {isLocked && anyOn ? <Lock className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                  {isLocked && anyOn ? 'Locked' : anyOn ? 'All Off' : 'All On'}
                </button>
              </div>

              {/* Global brightness */}
              <div className="flex items-center gap-3">
                <Sun className="w-4 h-4 text-muted-foreground" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(avgBrightness * 100)}
                  onChange={(e) => setBrightness(parseInt(e.target.value) / 100, 0.5)}
                  className="w-32 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-yellow-500"
                  disabled={isActing || !anyOn}
                />
                <span className="text-sm text-muted-foreground w-10">
                  {Math.round(avgBrightness * 100)}%
                </span>
              </div>
            </div>

            {/* Color/Scene tabs */}
            <div className="flex border-b border-border">
              {[
                { id: 'whites', icon: Sun, label: 'Whites' },
                { id: 'colors', icon: Palette, label: 'Colors' },
                { id: 'scenes', icon: Lightbulb, label: 'Scenes' },
                { id: 'effects', icon: Sparkles, label: 'Effects' },
              ].map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-foreground border-b-2 border-primary bg-muted/30'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
                    }`}
                  >
                    <TabIcon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="p-4 border-b border-border">
              {activeTab === 'whites' && (
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setPreset(preset.name, 0.5)}
                      disabled={isActing}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className="w-10 h-10 rounded-full border-2 border-border shadow-inner"
                        style={{ backgroundColor: preset.color }}
                      />
                      <span className="text-xs text-muted-foreground">{preset.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'colors' && (
                <div className="flex flex-wrap gap-2">
                  {RAINBOW_COLORS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setPreset(preset.name, 0.5)}
                      disabled={isActing}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      title={preset.name}
                    >
                      <div
                        className="w-10 h-10 rounded-full border-2 border-border shadow-lg"
                        style={{ backgroundColor: preset.color }}
                      />
                      <span className="text-xs text-muted-foreground">{preset.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'scenes' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {SCENE_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setPreset(preset.name, 1)}
                      disabled={isActing}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-all"
                    >
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: preset.color + '40' }}
                      >
                        <Lightbulb className="w-6 h-6" style={{ color: preset.color }} />
                      </div>
                      <span className="text-sm font-medium">{preset.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'effects' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => breathe('red', 3, 2)}
                      disabled={isActing}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-red-500/50 hover:bg-red-500/10 transition-all"
                    >
                      <Sparkles className="w-6 h-6 text-red-500" />
                      <span className="text-sm">Red Breathe</span>
                    </button>
                    <button
                      onClick={() => breathe('blue', 3, 2)}
                      disabled={isActing}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-blue-500/50 hover:bg-blue-500/10 transition-all"
                    >
                      <Sparkles className="w-6 h-6 text-blue-500" />
                      <span className="text-sm">Blue Breathe</span>
                    </button>
                    <button
                      onClick={() => pulse('green', 5, 0.5)}
                      disabled={isActing}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-green-500/50 hover:bg-green-500/10 transition-all"
                    >
                      <Sparkles className="w-6 h-6 text-green-500" />
                      <span className="text-sm">Green Pulse</span>
                    </button>
                  </div>
                  <button
                    onClick={stopEffects}
                    disabled={isActing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Stop Effects
                  </button>
                </div>
              )}
            </div>

            {/* Individual lights */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Individual Lights
              </h3>
              <div className="space-y-2">
                {lights.map((light) => (
                  <LightCard
                    key={light.id}
                    light={light}
                    onToggle={() =>
                      controller.isActing
                        ? null
                        : light.power === 'on'
                          ? controller.turnOff(`id:${light.id}`)
                          : controller.turnOn(`id:${light.id}`)
                    }
                    onBrightness={(b) =>
                      controller.setBrightness(b, 0.3)
                    }
                    isActing={isActing}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* No lights found */}
        {!isLoading && lights.length === 0 && !error && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <LightbulbOff className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Lights Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Make sure your LIFX bulbs are set up and connected to the same network.
            </p>
            <button
              onClick={refresh}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border bg-muted/20">
          <p className="text-xs text-muted-foreground text-center">
            LIFX Everyday A19 • Wi-Fi Connected • Matter Compatible
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * LIFXControllerTile - Quick access tile for LIFX smart bulbs
 * Click to open full controller popup
 */
export function LIFXControllerTile({ tile, className }: LIFXControllerTileProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const controller = useLIFXController();

  const { lights, isLoading, anyOn, isActing, toggle, error, isLocked, lockMessage } = controller;

  const lightsOn = lights.filter((l) => l.power === 'on').length;

  const baseClasses = `
    group
    relative
    flex flex-col
    p-3
    h-28
    bg-card
    border border-border
    rounded-lg
    hover:border-muted-foreground/30
    transition-all duration-150
    cursor-pointer
    ${tile.status === 'Done' ? 'opacity-60' : ''}
    ${className ?? ''}
  `.trim();

  return (
    <>
      <WarningBorderTrail
        active={tile.actionWarning || !!error}
        hoverMessage={error || tile.actionDesc}
      >
        <div className={baseClasses} onClick={() => setIsModalOpen(true)}>
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              {anyOn ? (
                <Lightbulb className="w-4 h-4 text-yellow-500" />
              ) : (
                <LightbulbOff className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="text-xs font-medium text-foreground">LIFX Lights</span>
            </div>

            {/* Quick toggle button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!(isLocked && anyOn)) {
                  toggle();
                }
              }}
              disabled={isActing || isLoading || (isLocked && anyOn)}
              className={`p-1.5 rounded-md transition-all ${
                isLocked && anyOn
                  ? 'bg-purple-500/20 text-purple-400 cursor-not-allowed'
                  : anyOn
                    ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              title={isLocked && anyOn ? lockMessage || 'Locked - Complete evening check-in' : anyOn ? 'Turn all off' : 'Turn all on'}
            >
              {isLocked && anyOn ? <Lock className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center gap-1">
            {isLoading && lights.length === 0 ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            ) : error ? (
              <div className="flex items-center gap-1 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs">Connection error</span>
              </div>
            ) : isLocked && anyOn ? (
              <>
                <div className="flex items-center gap-2 text-purple-400">
                  <Lock className="w-5 h-5" />
                  <span className="text-lg font-bold">Locked</span>
                </div>
                <span className="text-xs text-purple-300/70">
                  Complete evening check-in
                </span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-foreground">{lightsOn}</span>
                  <span className="text-sm text-muted-foreground">/ {lights.length}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {lights.length === 0 ? 'No lights' : anyOn ? 'Lights on' : 'Lights off'}
                </span>
              </>
            )}
          </div>

          {/* Status indicator */}
          {lights.length > 0 && (
            <div className="flex items-center justify-center gap-1">
              {lights.map((light) => (
                <div
                  key={light.id}
                  className={`w-2 h-2 rounded-full ${
                    light.power === 'on' ? 'bg-yellow-500' : 'bg-muted-foreground/30'
                  }`}
                  title={`${light.label}: ${light.power}`}
                />
              ))}
            </div>
          )}

          {/* Status dot */}
          {tile.status && tile.status !== 'Not started' && (
            <div
              className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                tile.status === 'In progress' ? 'bg-blue-500' : 'bg-green-500'
              }`}
            />
          )}
        </div>
      </WarningBorderTrail>

      {/* Modal */}
      {isModalOpen && (
        <LIFXControllerModal
          onClose={() => setIsModalOpen(false)}
          controller={controller}
        />
      )}
    </>
  );
}

export default LIFXControllerTile;
