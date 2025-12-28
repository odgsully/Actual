'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Phone,
  X,
  ExternalLink,
  CheckCircle,
  Circle,
  Mic,
  User,
  Settings,
  Zap,
  Shield,
  MessageSquare,
  Briefcase,
  Heart,
  Lightbulb,
  Code,
  Sparkles,
  Bot,
  PhoneCall,
  Users,
} from 'lucide-react';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { Tile } from '@/lib/types/tiles';
import {
  AGENT_DEFINITIONS,
  RETELL_AGENT_IDS,
  type AgentDefinition,
  type ModelTier,
} from '@/lib/voice/agents/definitions';

// ============================================================
// Types
// ============================================================

interface AudioAgentAdminTileProps {
  tile: Tile;
  className?: string;
}

// ============================================================
// Constants
// ============================================================

const MODEL_TIER_COLORS: Record<ModelTier, { bg: string; text: string; label: string }> = {
  economy: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Economy' },
  standard: { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Standard' },
  premium: { bg: 'bg-purple-500/10', text: 'text-purple-500', label: 'Premium' },
};

const DEPARTMENT_ICONS: Record<string, typeof Brain> = {
  'Executive Support': Shield,
  'SaaS Team': Code,
  'Engineering': Code,
  'Research': Lightbulb,
  'Film Production': Sparkles,
};

const PERSONA_ICONS: Record<string, typeof Brain> = {
  'Direct': Zap,
  'Diplomatic': Heart,
  'Analytical': Lightbulb,
  'Creative': Sparkles,
  'Casual': MessageSquare,
  'Technical': Code,
};

// ============================================================
// Helper Functions
// ============================================================

function getAgentIcon(agent: AgentDefinition): typeof Brain {
  return PERSONA_ICONS[agent.persona] || Brain;
}

function isAgentActive(slug: string): boolean {
  return slug in RETELL_AGENT_IDS && !!RETELL_AGENT_IDS[slug];
}

function formatVoiceProvider(provider: string): string {
  const providers: Record<string, string> = {
    elevenlabs: 'ElevenLabs',
    openai: 'OpenAI',
    cartesia: 'Cartesia',
  };
  return providers[provider] || provider;
}

// ============================================================
// Agent Row Component
// ============================================================

function AgentRow({ agent, index }: { agent: AgentDefinition; index: number }) {
  const isActive = isAgentActive(agent.slug);
  const tierInfo = MODEL_TIER_COLORS[agent.modelTier];
  const AgentIcon = getAgentIcon(agent);

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group border-b border-border/50 hover:bg-accent/30 transition-colors"
    >
      {/* Status */}
      <td className="py-3 px-4">
        <div className="flex items-center justify-center">
          {isActive ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <Circle className="w-4 h-4 text-muted-foreground/40" />
          )}
        </div>
      </td>

      {/* Agent Name & Role */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-accent rounded-lg">
            <AgentIcon className="w-4 h-4 text-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">{agent.name}</p>
            <p className="text-xs text-muted-foreground">{agent.role}</p>
          </div>
        </div>
      </td>

      {/* Department */}
      <td className="py-3 px-4 hidden md:table-cell">
        <span className="text-sm text-muted-foreground">{agent.department}</span>
      </td>

      {/* Persona */}
      <td className="py-3 px-4 hidden lg:table-cell">
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          {agent.persona}
        </span>
      </td>

      {/* Model Tier */}
      <td className="py-3 px-4">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${tierInfo.bg} ${tierInfo.text}`}
        >
          {tierInfo.label}
        </span>
      </td>

      {/* Voice Provider */}
      <td className="py-3 px-4 hidden sm:table-cell">
        <div className="flex items-center gap-1.5">
          <Mic className="w-3 h-3 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {formatVoiceProvider(agent.voiceProvider)}
          </span>
        </div>
      </td>

      {/* Intents */}
      <td className="py-3 px-4 hidden xl:table-cell">
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {agent.handlesIntents.slice(0, 3).map((intent) => (
            <span
              key={intent}
              className="px-1.5 py-0.5 text-[10px] bg-muted rounded text-muted-foreground"
            >
              {intent.replace(/_/g, ' ')}
            </span>
          ))}
          {agent.handlesIntents.length > 3 && (
            <span className="px-1.5 py-0.5 text-[10px] bg-muted rounded text-muted-foreground">
              +{agent.handlesIntents.length - 3}
            </span>
          )}
        </div>
      </td>
    </motion.tr>
  );
}

// ============================================================
// Modal Component
// ============================================================

type TabType = 'agents' | 'stats' | 'config';

function AgentModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<TabType>('agents');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Filter agents
  const filteredAgents = useMemo(() => {
    if (!searchQuery) return AGENT_DEFINITIONS;
    const query = searchQuery.toLowerCase();
    return AGENT_DEFINITIONS.filter(
      (agent) =>
        agent.name.toLowerCase().includes(query) ||
        agent.role.toLowerCase().includes(query) ||
        agent.department.toLowerCase().includes(query) ||
        agent.persona.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const activeAgents = AGENT_DEFINITIONS.filter((a) => isAgentActive(a.slug));
    const byTier = AGENT_DEFINITIONS.reduce(
      (acc, agent) => {
        acc[agent.modelTier] = (acc[agent.modelTier] || 0) + 1;
        return acc;
      },
      {} as Record<ModelTier, number>
    );
    const byDepartment = AGENT_DEFINITIONS.reduce(
      (acc, agent) => {
        acc[agent.department] = (acc[agent.department] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    return {
      total: AGENT_DEFINITIONS.length,
      active: activeAgents.length,
      byTier,
      byDepartment,
    };
  }, []);

  if (!isOpen) return null;

  const TabButton = ({ tab, label, icon: Icon }: { tab: TabType; label: string; icon: typeof Brain }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        activeTab === tab
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-6xl h-[90vh] bg-background border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Audio Agent Admin</h2>
                <p className="text-sm text-muted-foreground">
                  {stats.active}/{stats.total} agents active • Voice AI for real estate operations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="https://beta.retellai.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Retell Dashboard</span>
              </a>
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 px-6 py-3 border-b border-border bg-muted/30">
            <TabButton tab="agents" label="All Agents" icon={Users} />
            <TabButton tab="stats" label="Statistics" icon={Zap} />
            <TabButton tab="config" label="Configuration" icon={Settings} />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Agents Tab */}
            {activeTab === 'agents' && (
              <div className="space-y-4">
                {/* Search */}
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    placeholder="Search agents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 max-w-sm px-4 py-2 text-sm bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <span className="text-sm text-muted-foreground">
                    {filteredAgents.length} agent{filteredAgents.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Table */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-12">
                          Status
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Agent
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                          Department
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                          Persona
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Model
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                          Voice
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden xl:table-cell">
                          Handles
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAgents.map((agent, index) => (
                        <AgentRow key={agent.slug} agent={agent} index={index} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div className="space-y-8 max-w-4xl mx-auto">
                {/* Overview Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-accent/50 rounded-xl p-5">
                    <p className="text-sm text-muted-foreground mb-2">Total Agents</p>
                    <p className="text-4xl font-bold text-foreground">{stats.total}</p>
                  </div>
                  <div className="bg-green-500/10 rounded-xl p-5">
                    <p className="text-sm text-muted-foreground mb-2">Active in Retell</p>
                    <p className="text-4xl font-bold text-green-500">{stats.active}</p>
                  </div>
                  <div className="bg-accent/50 rounded-xl p-5">
                    <p className="text-sm text-muted-foreground mb-2">Phone Number</p>
                    <p className="text-lg font-bold text-foreground">+1 623-323-6043</p>
                  </div>
                  <div className="bg-accent/50 rounded-xl p-5">
                    <p className="text-sm text-muted-foreground mb-2">Platform</p>
                    <p className="text-lg font-bold text-primary">Retell AI</p>
                  </div>
                </div>

                {/* By Model Tier */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-foreground">By Model Tier</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {(['economy', 'standard', 'premium'] as ModelTier[]).map((tier) => {
                      const tierInfo = MODEL_TIER_COLORS[tier];
                      return (
                        <div key={tier} className={`${tierInfo.bg} rounded-xl p-5`}>
                          <p className={`text-sm ${tierInfo.text} mb-2`}>{tierInfo.label}</p>
                          <p className="text-3xl font-bold text-foreground">
                            {stats.byTier[tier] || 0}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* By Department */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-foreground">By Department</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(stats.byDepartment).map(([dept, count]) => {
                      const Icon = DEPARTMENT_ICONS[dept] || Briefcase;
                      return (
                        <div key={dept} className="bg-accent/50 rounded-xl p-5 flex items-center gap-4">
                          <div className="p-2 bg-background rounded-lg">
                            <Icon className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">{dept}</p>
                            <p className="text-2xl font-bold text-foreground">{count}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Config Tab */}
            {activeTab === 'config' && (
              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-amber-500 mb-2">Configuration</h3>
                  <p className="text-sm text-muted-foreground">
                    Agent configuration is managed via the Retell AI dashboard. Click the link above
                    to access agent settings, voice configuration, and call logs.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">Quick Links</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <a
                      href="https://beta.retellai.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-accent/50 rounded-xl hover:bg-accent transition-colors"
                    >
                      <PhoneCall className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">Retell Dashboard</p>
                        <p className="text-xs text-muted-foreground">Manage agents & calls</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto" />
                    </a>
                    <a
                      href="/api/voice/agents"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-accent/50 rounded-xl hover:bg-accent transition-colors"
                    >
                      <Code className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">Agents API</p>
                        <p className="text-xs text-muted-foreground">View agent data</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto" />
                    </a>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">Environment</h3>
                  <div className="bg-muted/50 rounded-xl p-4 font-mono text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">RETELL_API_KEY</span>
                      <span className="text-green-500">✓ Configured</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">RETELL_PHONE_NUMBER</span>
                      <span className="text-foreground">+1 623-323-6043</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">RETELL_WEBHOOK_SECRET</span>
                      <span className="text-green-500">✓ Configured</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ============================================================
// Main Tile Component
// ============================================================

/**
 * AudioAgentAdminTile - Compact tile that opens a modal with agent management
 *
 * Pattern: Tile as Launcher
 * - Fixed h-28 height (112px)
 * - Shows agent count preview
 * - Click opens full modal with agent table
 */
export function AudioAgentAdminTile({ tile, className }: AudioAgentAdminTileProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeCount = useMemo(
    () => AGENT_DEFINITIONS.filter((a) => isAgentActive(a.slug)).length,
    []
  );

  return (
    <>
      <WarningBorderTrail active={tile.actionWarning} hoverMessage={tile.actionDesc}>
        <div
          className={`
            group relative flex flex-col p-4 h-28
            bg-card border border-border rounded-lg
            hover:bg-accent hover:border-muted-foreground/30
            transition-all duration-150 cursor-pointer
            ${tile.status === 'Done' ? 'opacity-60' : ''}
            ${className ?? ''}
          `}
          onClick={() => setIsModalOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setIsModalOpen(true)}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-medium text-foreground truncate">
                {tile.name || 'Audio Agent Admin'}
              </h3>
            </div>
            <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Compact Stats Preview */}
          <div className="flex-1 flex items-center justify-around">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground tabular-nums">
                {AGENT_DEFINITIONS.length}
              </p>
              <p className="text-[10px] text-muted-foreground">Agents</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-500 tabular-nums">{activeCount}</p>
              <p className="text-[10px] text-muted-foreground">Active</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Phone className="w-3 h-3 text-primary" />
                <p className="text-xs font-medium text-primary">623</p>
              </div>
              <p className="text-[10px] text-muted-foreground">Phone</p>
            </div>
          </div>
        </div>
      </WarningBorderTrail>

      {/* Modal */}
      <AgentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

export default AudioAgentAdminTile;
