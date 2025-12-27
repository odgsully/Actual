'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { User, Phone, Mail, RefreshCw, Shuffle, Building2 } from 'lucide-react';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { TileComponentProps } from '../TileRegistry';
import type { Contact } from '@/lib/contacts/types';

// ============================================================
// Slot Machine Animation Component
// ============================================================

interface SlotMachineProps {
  contacts: Contact[];
  finalContact: Contact;
  isSpinning: boolean;
  onSpinComplete: () => void;
}

function SlotMachine({ contacts, finalContact, isSpinning, onSpinComplete }: SlotMachineProps) {
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);

  // Create a list of names for the spin animation
  const spinNames = [...contacts.slice(0, 15), finalContact];
  const itemHeight = 40; // px per name

  useEffect(() => {
    if (isSpinning) {
      // Start at top, spin through all names, land on final
      controls.start({
        y: -(spinNames.length - 1) * itemHeight,
        transition: {
          duration: 2.5,
          ease: [0.25, 0.1, 0.25, 1], // Custom easing for slot machine feel
        },
      }).then(() => {
        onSpinComplete();
      });
    } else {
      // Reset to show final contact
      controls.set({ y: -(spinNames.length - 1) * itemHeight });
    }
  }, [isSpinning, controls, spinNames.length, onSpinComplete]);

  return (
    <div
      ref={containerRef}
      className="relative h-[40px] overflow-hidden w-full"
      style={{ maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)' }}
    >
      <motion.div
        animate={controls}
        initial={{ y: 0 }}
        className="flex flex-col"
      >
        {spinNames.map((contact, index) => (
          <div
            key={`${contact.id}-${index}`}
            className="h-[40px] flex items-center justify-center"
          >
            <span className="text-lg font-semibold text-foreground truncate max-w-[200px]">
              {contact.fullName}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ============================================================
// Contact Display Component
// ============================================================

interface ContactDisplayProps {
  contact: Contact;
  isNew: boolean;
}

function ContactDisplay({ contact, isNew }: ContactDisplayProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={contact.id}
        initial={isNew ? { opacity: 0, scale: 0.9 } : false}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-2 w-full"
      >
        {/* Avatar circle with initials */}
        <motion.div
          className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"
          initial={isNew ? { rotate: -180, scale: 0 } : false}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        >
          <span className="text-lg font-bold text-primary">
            {getInitials(contact.fullName)}
          </span>
        </motion.div>

        {/* Name */}
        <motion.h4
          className="text-base font-semibold text-foreground text-center truncate max-w-full px-2"
          initial={isNew ? { y: 10, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {contact.fullName}
        </motion.h4>

        {/* Contact details */}
        <motion.div
          className="flex flex-col gap-1 items-center text-xs text-muted-foreground"
          initial={isNew ? { y: 10, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <Phone className="w-3 h-3" />
              <span>{contact.phone}</span>
            </a>
          )}
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="flex items-center gap-1 hover:text-primary transition-colors truncate max-w-[180px]"
            >
              <Mail className="w-3 h-3" />
              <span className="truncate">{contact.email}</span>
            </a>
          )}
          {contact.organization && (
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              <span className="truncate max-w-[150px]">{contact.organization}</span>
            </span>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================
// Helper Functions
// ============================================================

function getInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ============================================================
// Main Component
// ============================================================

/**
 * RandomContactTile - Daily random contact with slot machine animation
 *
 * Features:
 * - Slot machine style spinning animation
 * - Shows random contact from imported Apple Contacts
 * - Click-to-call and click-to-email links
 * - Respin button for new random selection
 * - Stores daily contact in localStorage
 *
 * @example
 * ```tsx
 * <RandomContactTile tile={tile} />
 * ```
 */
export function RandomContactTile({ tile, className }: TileComponentProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [currentContact, setCurrentContact] = useState<Contact | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showSlotMachine, setShowSlotMachine] = useState(false);
  const [isNewContact, setIsNewContact] = useState(false);

  // Load contacts on mount
  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch contacts with phone numbers
      const response = await fetch('/api/contacts?withPhone=true&count=20');
      if (!response.ok) throw new Error('Failed to load contacts');

      const data = await response.json();
      const allContacts = data.contacts || [];

      if (allContacts.length === 0) {
        throw new Error('No contacts found');
      }

      setContacts(allContacts);

      // Check localStorage for today's contact
      const storedData = localStorage.getItem('gs-daily-contact');
      if (storedData) {
        const { contact, date } = JSON.parse(storedData);
        const today = new Date().toDateString();
        if (date === today && contact) {
          setCurrentContact(contact);
          setIsLoading(false);
          return;
        }
      }

      // No stored contact for today, pick a random one
      const randomContact = allContacts[Math.floor(Math.random() * allContacts.length)];
      setCurrentContact(randomContact);
      saveContactForToday(randomContact);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const saveContactForToday = (contact: Contact) => {
    localStorage.setItem(
      'gs-daily-contact',
      JSON.stringify({
        contact,
        date: new Date().toDateString(),
      })
    );
  };

  const handleSpin = useCallback(async () => {
    if (isSpinning || contacts.length === 0) return;

    // Fetch fresh random contacts for the spin
    try {
      const response = await fetch('/api/contacts?withPhone=true&count=20');
      if (!response.ok) throw new Error('Failed to load contacts');

      const data = await response.json();
      const spinContacts = data.contacts || contacts;

      // Pick a new final contact (different from current if possible)
      let newContact = spinContacts[Math.floor(Math.random() * spinContacts.length)];
      if (spinContacts.length > 1 && currentContact && newContact.id === currentContact.id) {
        const others = spinContacts.filter((c: Contact) => c.id !== currentContact.id);
        newContact = others[Math.floor(Math.random() * others.length)];
      }

      setContacts(spinContacts);
      setShowSlotMachine(true);
      setIsSpinning(true);
      setIsNewContact(false);

      // Store the new contact after a brief delay (animation will complete)
      setTimeout(() => {
        setCurrentContact(newContact);
        saveContactForToday(newContact);
      }, 2400);
    } catch (err) {
      console.error('Spin error:', err);
    }
  }, [isSpinning, contacts, currentContact]);

  const handleSpinComplete = useCallback(() => {
    setIsSpinning(false);
    setShowSlotMachine(false);
    setIsNewContact(true);
  }, []);

  const baseClasses = `
    group
    relative
    flex flex-col
    p-4
    min-h-[10rem]
    bg-card
    border border-border
    rounded-lg
    hover:border-muted-foreground/30
    transition-all duration-150
    ${tile.status === 'Done' ? 'opacity-60' : ''}
    ${className ?? ''}
  `.trim();

  return (
    <WarningBorderTrail active={tile.actionWarning} hoverMessage={tile.actionDesc}>
      <div className={baseClasses}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-medium text-foreground">
              Contact Random
            </h3>
          </div>

          {/* Spin button */}
          <button
            onClick={handleSpin}
            disabled={isSpinning || isLoading}
            className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-50"
            title="Pick new random contact"
          >
            <motion.div
              animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
              transition={isSpinning ? { duration: 0.5, repeat: Infinity, ease: 'linear' } : {}}
            >
              <Shuffle className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center">
          {isLoading && (
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
              <span className="text-xs text-muted-foreground">Loading contacts...</span>
            </div>
          )}

          {error && (
            <div className="text-center">
              <User className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground mb-2">{error.message}</p>
              <button
                onClick={loadContacts}
                className="text-xs text-primary hover:underline"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && showSlotMachine && currentContact && (
            <SlotMachine
              contacts={contacts}
              finalContact={currentContact}
              isSpinning={isSpinning}
              onSpinComplete={handleSpinComplete}
            />
          )}

          {!isLoading && !error && !showSlotMachine && currentContact && (
            <ContactDisplay contact={currentContact} isNew={isNewContact} />
          )}
        </div>

        {/* Footer - contact count */}
        {contacts.length > 0 && !isLoading && (
          <div className="text-center mt-2">
            <span className="text-[10px] text-muted-foreground">
              from {contacts.length} contacts
            </span>
          </div>
        )}

        {/* 3rd Party indicator */}
        {tile.thirdParty?.length > 0 && (
          <div className="absolute bottom-2 right-2">
            <div
              className="w-1.5 h-1.5 rounded-full bg-purple-500 opacity-60"
              title={`Data from: ${tile.thirdParty.join(', ')}`}
            />
          </div>
        )}
      </div>
    </WarningBorderTrail>
  );
}

export default RandomContactTile;
