import { supabase } from '@/lib/supabase'
import type { CollaboratorRole } from '@/types/app'

export async function getCollaborators(collectionId: string) {
  return supabase
    .from('collaborators')
    .select('*')
    .eq('collection_id', collectionId)
}

export async function inviteCollaborator(
  collectionId: string,
  userId: string,
  role: CollaboratorRole
) {
  const result = await supabase.from('collaborators').insert({
    collection_id: collectionId,
    user_id: userId,
    role,
  })

  // Auto-toggle collaboration_mode to 'team' when first non-owner collaborator is added
  if (!result.error) {
    await supabase
      .from('collections')
      .update({ collaboration_mode: 'team' })
      .eq('id', collectionId)
      .eq('collaboration_mode', 'solo')
  }

  return result
}

/** Invite a user by email via Edge Function (server-side lookup) */
export async function inviteByEmail(
  collectionId: string,
  email: string,
  role: CollaboratorRole
) {
  const { data, error } = await supabase.functions.invoke('invite-by-email', {
    body: { collection_id: collectionId, email, role },
  })

  if (error) return { data: null, error }
  if (data?.error) return { data: null, error: { message: data.error } }

  // Auto-toggle collaboration_mode to 'team'
  await supabase
    .from('collections')
    .update({ collaboration_mode: 'team' })
    .eq('id', collectionId)
    .eq('collaboration_mode', 'solo')

  return { data: data.collaborator, error: null }
}

export async function acceptInvite(collaboratorId: string) {
  return supabase
    .from('collaborators')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', collaboratorId)
}

export async function updateCollaboratorRole(
  id: string,
  role: CollaboratorRole
) {
  return supabase.from('collaborators').update({ role }).eq('id', id)
}

export async function removeCollaborator(id: string) {
  return supabase.from('collaborators').delete().eq('id', id)
}
