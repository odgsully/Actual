/**
 * GSRealty Invitation Database Functions
 *
 * CRUD operations for gsrealty_invitations table
 * Handles client invitation and account setup flow
 */

import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export interface GSRealtyInvitation {
  id: string;
  client_id: string;
  email: string;
  token: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
  created_by: string | null;
  custom_message: string | null;
}

export interface CreateInvitationInput {
  clientId: string;
  email: string;
  customMessage?: string;
  expiresInDays?: number;
  createdBy?: string;
}

/**
 * Create a new invitation with secure token
 */
export async function createInvitation(
  input: CreateInvitationInput
): Promise<{
  invitation: GSRealtyInvitation | null;
  error: Error | null;
}> {
  try {
    const supabase = createSupabaseClient();

    // Generate secure token (UUID v4)
    const token = uuidv4();

    // Calculate expiration (default 7 days)
    const expiresInDays = input.expiresInDays || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const { data, error } = await supabase
      .from('gsrealty_invitations')
      .insert({
        client_id: input.clientId,
        email: input.email,
        token: token,
        expires_at: expiresAt.toISOString(),
        custom_message: input.customMessage || null,
        created_by: input.createdBy || null,
      })
      .select()
      .single();

    if (error) throw error;

    console.log('[GSRealty] Invitation created:', data.id);
    return { invitation: data, error: null };
  } catch (error) {
    console.error('[GSRealty] Error creating invitation:', error);
    return { invitation: null, error: error as Error };
  }
}

/**
 * Get invitation by token (for setup page)
 * Uses anon client for public access
 */
export async function getInvitationByToken(
  token: string
): Promise<{
  invitation: GSRealtyInvitation | null;
  error: Error | null;
}> {
  try {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from('gsrealty_invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (error) throw error;

    // Check if invitation is valid
    if (data.used_at) {
      throw new Error('This invitation has already been used.');
    }

    if (new Date(data.expires_at) < new Date()) {
      throw new Error('This invitation has expired.');
    }

    return { invitation: data, error: null };
  } catch (error) {
    console.error('[GSRealty] Error fetching invitation by token:', error);
    return { invitation: null, error: error as Error };
  }
}

/**
 * Get invitation by ID
 */
export async function getInvitationById(
  id: string
): Promise<{
  invitation: GSRealtyInvitation | null;
  error: Error | null;
}> {
  try {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from('gsrealty_invitations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return { invitation: data, error: null };
  } catch (error) {
    console.error('[GSRealty] Error fetching invitation:', error);
    return { invitation: null, error: error as Error };
  }
}

/**
 * Get all invitations for a client
 */
export async function getClientInvitations(
  clientId: string
): Promise<{
  invitations: GSRealtyInvitation[] | null;
  error: Error | null;
}> {
  try {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from('gsrealty_invitations')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { invitations: data, error: null };
  } catch (error) {
    console.error('[GSRealty] Error fetching client invitations:', error);
    return { invitations: null, error: error as Error };
  }
}

/**
 * Get all pending invitations (not used, not expired)
 */
export async function getPendingInvitations(): Promise<{
  invitations: GSRealtyInvitation[] | null;
  error: Error | null;
}> {
  try {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from('gsrealty_invitations')
      .select('*')
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { invitations: data, error: null };
  } catch (error) {
    console.error('[GSRealty] Error fetching pending invitations:', error);
    return { invitations: null, error: error as Error };
  }
}

/**
 * Mark invitation as used
 */
export async function markInvitationUsed(
  token: string
): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    const supabase = createSupabaseClient();

    const { error } = await supabase
      .from('gsrealty_invitations')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token)
      .is('used_at', null);

    if (error) throw error;

    console.log('[GSRealty] Invitation marked as used:', token);
    return { success: true, error: null };
  } catch (error) {
    console.error('[GSRealty] Error marking invitation as used:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Invalidate an invitation (for resend scenario)
 */
export async function invalidateInvitation(
  id: string
): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    const supabase = createSupabaseClient();

    // Set used_at to invalidate
    const { error } = await supabase
      .from('gsrealty_invitations')
      .update({ used_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    console.log('[GSRealty] Invitation invalidated:', id);
    return { success: true, error: null };
  } catch (error) {
    console.error('[GSRealty] Error invalidating invitation:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Delete expired invitations (cleanup)
 */
export async function deleteExpiredInvitations(): Promise<{
  count: number;
  error: Error | null;
}> {
  try {
    const supabase = createSupabaseClient();

    // Delete invitations expired more than 30 days ago
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const { data, error } = await supabase
      .from('gsrealty_invitations')
      .delete()
      .lt('expires_at', cutoffDate.toISOString())
      .select();

    if (error) throw error;

    const count = data?.length || 0;
    console.log('[GSRealty] Deleted expired invitations:', count);
    return { count, error: null };
  } catch (error) {
    console.error('[GSRealty] Error deleting expired invitations:', error);
    return { count: 0, error: error as Error };
  }
}

/**
 * Check if client has pending invitation
 */
export async function hasClientPendingInvitation(
  clientId: string
): Promise<{
  hasPending: boolean;
  invitation: GSRealtyInvitation | null;
  error: Error | null;
}> {
  try {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from('gsrealty_invitations')
      .select('*')
      .eq('client_id', clientId)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return {
      hasPending: !!data,
      invitation: data,
      error: null,
    };
  } catch (error) {
    console.error('[GSRealty] Error checking pending invitation:', error);
    return { hasPending: false, invitation: null, error: error as Error };
  }
}
