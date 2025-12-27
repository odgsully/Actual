import type { Contact, ContactsData } from './types';

/**
 * Parse a vCard file content into an array of contacts
 *
 * Supports vCard 3.0 format exported from Apple Contacts
 */
export function parseVCard(vcfContent: string): Contact[] {
  const contacts: Contact[] = [];
  const vcards = vcfContent.split('END:VCARD');

  for (const vcard of vcards) {
    if (!vcard.includes('BEGIN:VCARD')) continue;

    const lines = vcard.split('\n').map((line) => line.trim());

    let fullName = '';
    let firstName = '';
    let lastName = '';
    let phone = '';
    let email = '';
    let organization = '';
    let note = '';

    for (const line of lines) {
      // Full name (FN:)
      if (line.startsWith('FN:')) {
        fullName = line.substring(3).trim();
      }

      // Structured name (N:lastName;firstName;;;)
      if (line.startsWith('N:') || line.startsWith('N;')) {
        const nLine = line.startsWith('N:') ? line.substring(2) : line.split(':')[1] || '';
        const parts = nLine.split(';');
        lastName = parts[0]?.trim() || '';
        firstName = parts[1]?.trim() || '';
      }

      // Phone number - handle various TEL formats
      if (line.includes('TEL') && line.includes(':')) {
        const colonIndex = line.lastIndexOf(':');
        const phoneValue = line.substring(colonIndex + 1).trim();
        // Only take the first phone number
        if (!phone && phoneValue) {
          phone = formatPhoneNumber(phoneValue);
        }
      }

      // Email
      if (line.includes('EMAIL') && line.includes(':')) {
        const colonIndex = line.lastIndexOf(':');
        const emailValue = line.substring(colonIndex + 1).trim();
        if (!email && emailValue) {
          email = emailValue;
        }
      }

      // Organization
      if (line.startsWith('ORG:')) {
        organization = line.substring(4).split(';')[0].trim();
      }

      // Note
      if (line.startsWith('NOTE:')) {
        note = line.substring(5).trim().replace(/\\n/g, ' ');
      }
    }

    // Skip contacts without a name
    if (!fullName && !firstName && !lastName) continue;

    // Generate display name
    const displayName = fullName || `${firstName} ${lastName}`.trim();

    // Create unique ID from name
    const id = generateContactId(displayName);

    contacts.push({
      id,
      fullName: displayName,
      firstName,
      lastName,
      phone: phone || undefined,
      email: email || undefined,
      organization: organization || undefined,
      note: note || undefined,
    });
  }

  return contacts;
}

/**
 * Format phone number for display
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // If US number without country code
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // If US number with +1
  if (cleaned.startsWith('+1') && cleaned.length === 12) {
    const num = cleaned.slice(2);
    return `(${num.slice(0, 3)}) ${num.slice(3, 6)}-${num.slice(6)}`;
  }

  // Return as-is for international numbers
  return phone;
}

/**
 * Generate a unique ID for a contact
 */
function generateContactId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

/**
 * Get a random contact from the list
 */
export function getRandomContact(contacts: Contact[]): Contact | null {
  if (contacts.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * contacts.length);
  return contacts[randomIndex];
}

/**
 * Get multiple random contacts (for the spin animation)
 */
export function getRandomContacts(contacts: Contact[], count: number): Contact[] {
  if (contacts.length === 0) return [];
  if (contacts.length <= count) return [...contacts];

  const shuffled = [...contacts].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Filter contacts to only those with phone numbers (for reach-out purposes)
 */
export function filterContactsWithPhone(contacts: Contact[]): Contact[] {
  return contacts.filter((c) => c.phone);
}

/**
 * Load and parse contacts data
 */
export function createContactsData(contacts: Contact[]): ContactsData {
  return {
    contacts,
    totalCount: contacts.length,
    lastUpdated: new Date().toISOString(),
  };
}
