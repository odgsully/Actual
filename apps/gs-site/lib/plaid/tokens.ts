/**
 * Plaid Token Encryption
 *
 * AES-256-GCM encryption for Plaid access tokens before storing in Supabase.
 * Access tokens are NEVER stored in plaintext.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.PLAID_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('PLAID_ENCRYPTION_KEY environment variable is required');
  }
  // Key must be 32 bytes for AES-256
  const keyBuffer = Buffer.from(key, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error('PLAID_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }
  return keyBuffer;
}

/**
 * Encrypt a Plaid access token.
 * Returns a string in format: iv:encrypted:authTag (all hex-encoded)
 */
export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
}

/**
 * Decrypt a Plaid access token.
 * Expects input in format: iv:encrypted:authTag (all hex-encoded)
 */
export function decryptToken(ciphertext: string): string {
  const key = getEncryptionKey();
  const [ivHex, encryptedHex, authTagHex] = ciphertext.split(':');

  if (!ivHex || !encryptedHex || !authTagHex) {
    throw new Error('Invalid encrypted token format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
