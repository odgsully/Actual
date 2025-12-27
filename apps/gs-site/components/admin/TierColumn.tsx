'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Phone, Mail, Building2 } from 'lucide-react';
import type { ContactWithTier, ContactTier } from '@/lib/contacts/types';
import { TIER_CONFIG } from '@/lib/contacts/types';

interface TierColumnProps {
  tier: ContactTier;
  contacts: ContactWithTier[];
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onClick: (id: string) => void;
  isUpdating?: boolean;
}

/**
 * Single column displaying contacts for a tier with virtualization
 */
export default function TierColumn({
  tier,
  contacts,
  selectedIds,
  onSelect,
  onClick,
  isUpdating = false,
}: TierColumnProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const config = TIER_CONFIG[tier];

  const virtualizer = useVirtualizer({
    count: contacts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // Estimated row height
    overscan: 5,
  });

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card overflow-hidden">
      {/* Column Header */}
      <div className={`p-3 border-b border-border ${config.bgClass}`}>
        <h3 className="font-semibold flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${config.dotClass}`} />
          {config.label}
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {contacts.length}
          </span>
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
      </div>

      {/* Virtualized List */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto"
        style={{ maxHeight: '500px' }}
      >
        {contacts.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No contacts in this tier
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const contact = contacts[virtualItem.index];
              const isSelected = selectedIds.has(contact.id);

              return (
                <div
                  key={contact.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className={`
                    p-2 border-b border-border/50 cursor-pointer
                    transition-colors duration-150
                    ${isSelected ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-muted/50'}
                    ${isUpdating ? 'opacity-50 pointer-events-none' : ''}
                  `}
                  onClick={() => onClick(contact.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onSelect(contact.id);
                  }}
                >
                  <ContactCard contact={contact} isSelected={isSelected} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Contact card display within a tier column
 */
function ContactCard({
  contact,
  isSelected,
}: {
  contact: ContactWithTier;
  isSelected: boolean;
}) {
  // Get initials for avatar
  const initials = contact.fullName
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex items-center gap-2">
      {/* Avatar */}
      <div
        className={`
          w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0
          ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
        `}
      >
        {initials || '?'}
      </div>

      {/* Contact info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate" title={contact.fullName}>
          {contact.fullName}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {contact.phone && (
            <span className="flex items-center gap-0.5 truncate" title={contact.phone}>
              <Phone className="w-3 h-3" />
              <span className="truncate max-w-[80px]">{contact.phone}</span>
            </span>
          )}
          {contact.email && (
            <span className="flex items-center gap-0.5 truncate" title={contact.email}>
              <Mail className="w-3 h-3" />
              <span className="truncate max-w-[100px]">{contact.email}</span>
            </span>
          )}
          {contact.organization && !contact.phone && !contact.email && (
            <span className="flex items-center gap-0.5 truncate" title={contact.organization}>
              <Building2 className="w-3 h-3" />
              <span className="truncate">{contact.organization}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
