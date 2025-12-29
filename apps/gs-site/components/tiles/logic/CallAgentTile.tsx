'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Phone, ExternalLink } from 'lucide-react';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { Tile } from '@/lib/types/tiles';

// ============================================================
// Types
// ============================================================

interface CallAgentTileProps {
  tile: Tile;
  className?: string;
}

// ============================================================
// Agent Profile Mapping
// ============================================================

interface AgentProfile {
  name: string;
  role: string;
  image: string;
  phoneNumber?: string;
}

const AGENT_PROFILES: Record<string, AgentProfile> = {
  'daniel': {
    name: 'Daniel',
    role: 'Backend',
    image: '/agent-team/profile-pics/daniel-park.png',
    phoneNumber: '+1 623-323-6043',
  },
  'morgan': {
    name: 'Morgan',
    role: 'Executive Assistant',
    image: '/agent-team/profile-pics/Morgan.png',
    phoneNumber: '+1 623-323-6043',
  },
  'victoria': {
    name: 'Victoria',
    role: 'Research',
    image: '/agent-team/profile-pics/victoria-chen.png',
    phoneNumber: '+1 623-323-6043',
  },
  'emily': {
    name: 'Emily',
    role: 'Strategic EA',
    image: '/agent-team/profile-pics/emily-liu.png',
    phoneNumber: '+1 623-323-6043',
  },
  'sarah': {
    name: 'Sarah',
    role: 'Frontend',
    image: '/agent-team/profile-pics/sarah-williams.png',
    phoneNumber: '+1 623-323-6043',
  },
};

function getAgentFromTileName(name: string): AgentProfile | null {
  const lowerName = name.toLowerCase();

  if (lowerName.includes('daniel')) {
    return AGENT_PROFILES['daniel'];
  }
  if (lowerName.includes('morgan')) {
    return AGENT_PROFILES['morgan'];
  }
  if (lowerName.includes('victoria')) {
    return AGENT_PROFILES['victoria'];
  }
  if (lowerName.includes('emily')) {
    return AGENT_PROFILES['emily'];
  }
  if (lowerName.includes('sarah')) {
    return AGENT_PROFILES['sarah'];
  }

  return null;
}

// ============================================================
// Main Component
// ============================================================

/**
 * CallAgentTile - Tile for calling voice AI agents
 *
 * Features:
 * - Circular profile picture
 * - Agent name and role
 * - Click to call functionality
 */
export function CallAgentTile({ tile, className }: CallAgentTileProps) {
  const [isHovered, setIsHovered] = useState(false);
  const agent = getAgentFromTileName(tile.name);

  if (!agent) {
    // Fallback to basic button tile behavior
    return null;
  }

  const handleCall = () => {
    if (agent.phoneNumber) {
      window.open(`tel:${agent.phoneNumber}`, '_self');
    }
  };

  return (
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
        onClick={handleCall}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleCall()}
      >
        {/* Status indicator */}
        {tile.status && tile.status !== 'Not started' && (
          <div
            className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
              tile.status === 'In progress' ? 'bg-blue-500' : 'bg-green-500'
            }`}
          />
        )}

        {/* Content */}
        <div className="flex items-center gap-3 flex-1">
          {/* Profile Picture */}
          <div className="relative w-12 h-12 flex-shrink-0">
            <div className="absolute inset-0 rounded-full overflow-hidden border-2 border-border group-hover:border-primary/50 transition-colors">
              <Image
                src={agent.image}
                alt={agent.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-card" />
          </div>

          {/* Name and Role */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-foreground truncate">
              {tile.name}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {agent.role}
            </p>
          </div>

          {/* Call Icon */}
          <div
            className={`
              p-2 rounded-full transition-all duration-200
              ${isHovered ? 'bg-green-500 text-white scale-110' : 'bg-muted text-muted-foreground'}
            `}
          >
            <Phone className="w-4 h-4" />
          </div>
        </div>
      </div>
    </WarningBorderTrail>
  );
}

export default CallAgentTile;
