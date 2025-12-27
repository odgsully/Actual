'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Upload,
  Users,
  X,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import TierColumn from './TierColumn';
import {
  useContactsGrouped,
  useUpdateTiers,
  useImportContacts,
  useImportStatus,
} from './hooks/useContactTiers';
import type { ContactTier, ContactWithTier } from '@/lib/contacts/types';
import { TIER_CONFIG, getNextTier, TIER_CYCLE } from '@/lib/contacts/types';

/**
 * Contact Tier Manager Component
 *
 * 3-column UI for managing contact tier assignments for accountability reports.
 * - Non-Circle: Never receives reports
 * - Tier II: Monthly reports
 * - Tier I: Weekly reports
 */
export default function ContactTierManager() {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Data fetching
  const { data: grouped, isLoading, error, refetch } = useContactsGrouped();
  const { data: hasImported, isLoading: checkingImport } = useImportStatus();
  const updateTiers = useUpdateTiers();
  const importContacts = useImportContacts();

  // Filter contacts by search
  const filteredContacts = useMemo(() => {
    if (!grouped) return { none: [], tier2: [], tier1: [] };

    const searchLower = search.toLowerCase().trim();
    if (!searchLower) return grouped;

    const filter = (contacts: ContactWithTier[]) =>
      contacts.filter(
        (c) =>
          c.fullName.toLowerCase().includes(searchLower) ||
          c.email?.toLowerCase().includes(searchLower) ||
          c.organization?.toLowerCase().includes(searchLower) ||
          c.phone?.includes(searchLower)
      );

    return {
      none: filter(grouped.none),
      tier1: filter(grouped.tier1),
      tier2: filter(grouped.tier2),
    };
  }, [grouped, search]);

  // Handle clicking a contact to cycle tier
  const handleContactClick = async (contactId: string, currentTier: ContactTier) => {
    const nextTier = getNextTier(currentTier);
    try {
      await updateTiers.mutateAsync({ contactIds: [contactId], tier: nextTier });
    } catch (err) {
      console.error('Failed to update tier:', err);
    }
  };

  // Handle selection toggle
  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Handle bulk tier assignment
  const handleBulkAssign = async (tier: ContactTier) => {
    if (selectedIds.size === 0) return;

    try {
      await updateTiers.mutateAsync({ contactIds: [...selectedIds], tier });
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Failed to update tiers:', err);
    }
  };

  // Handle import
  const handleImport = async () => {
    try {
      await importContacts.mutateAsync();
    } catch (err) {
      console.error('Failed to import contacts:', err);
    }
  };

  // Show import prompt if no contacts
  if (!checkingImport && !hasImported && !isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Import Contacts</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
          Import your Apple Contacts to start assigning accountability tiers.
          Contacts will be imported from the VCF file in the project.
        </p>
        <button
          onClick={handleImport}
          disabled={importContacts.isPending}
          className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {importContacts.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Import Contacts
            </>
          )}
        </button>

        {importContacts.isSuccess && (
          <div className="mt-4 flex items-center justify-center gap-2 text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm">
              Imported {importContacts.data?.imported} contacts successfully!
            </span>
          </div>
        )}

        {importContacts.isError && (
          <div className="mt-4 flex items-center justify-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">
              {importContacts.error instanceof Error
                ? importContacts.error.message
                : 'Failed to import contacts'}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Loading state
  if (isLoading || checkingImport) {
    return (
      <div className="rounded-lg border border-border bg-card p-8">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Loading contacts...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to Load Contacts</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {error instanceof Error ? error.message : 'An error occurred'}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const totalFiltered =
    filteredContacts.none.length + filteredContacts.tier1.length + filteredContacts.tier2.length;
  const totalAll = grouped
    ? grouped.none.length + grouped.tier1.length + grouped.tier2.length
    : 0;

  return (
    <div className="space-y-4">
      {/* Search and Actions Bar */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts by name, email, or organization..."
            className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Re-import button */}
        <button
          onClick={handleImport}
          disabled={importContacts.isPending}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background hover:bg-muted transition-colors text-sm disabled:opacity-50"
          title="Re-import contacts from VCF file"
        >
          {importContacts.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          Re-import
        </button>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30">
          <span className="text-sm font-medium">
            {selectedIds.size} contact{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Move to:</span>
          {TIER_CYCLE.map((tier) => (
            <button
              key={tier}
              onClick={() => handleBulkAssign(tier)}
              disabled={updateTiers.isPending}
              className={`
                px-3 py-1 rounded-full text-xs font-medium transition-colors
                ${TIER_CONFIG[tier].badgeClass}
                hover:opacity-80 disabled:opacity-50
              `}
            >
              {TIER_CONFIG[tier].label}
            </button>
          ))}
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-sm text-muted-foreground hover:text-foreground"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Usage hint */}
      <div className="text-xs text-muted-foreground">
        <strong>Tip:</strong> Click a contact to cycle through tiers. Right-click to select
        multiple, then use the buttons above to bulk assign.
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-3 gap-4">
        <TierColumn
          tier="none"
          contacts={filteredContacts.none}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onClick={(id) => handleContactClick(id, 'none')}
          isUpdating={updateTiers.isPending}
        />
        <TierColumn
          tier="tier2"
          contacts={filteredContacts.tier2}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onClick={(id) => handleContactClick(id, 'tier2')}
          isUpdating={updateTiers.isPending}
        />
        <TierColumn
          tier="tier1"
          contacts={filteredContacts.tier1}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onClick={(id) => handleContactClick(id, 'tier1')}
          isUpdating={updateTiers.isPending}
        />
      </div>

      {/* Stats Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border">
        <div className="flex gap-4">
          <span>
            Non-Circle: <strong>{filteredContacts.none.length}</strong>
          </span>
          <span>
            Tier II: <strong>{filteredContacts.tier2.length}</strong>
          </span>
          <span>
            Tier I: <strong>{filteredContacts.tier1.length}</strong>
          </span>
        </div>
        <div>
          {search ? (
            <span>
              Showing {totalFiltered} of {totalAll} contacts
            </span>
          ) : (
            <span>Total: {totalAll} contacts</span>
          )}
        </div>
      </div>
    </div>
  );
}
