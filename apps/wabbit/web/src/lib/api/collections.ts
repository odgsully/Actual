import { supabase } from '@/lib/supabase'
import type { NewWabbForm, BranchCarryOver } from '@/types/app'
import type { Database } from '@/types/database'

type Json = Database['public']['Tables']['collections']['Insert']['quaternary_labels']

export async function getCollections() {
  return supabase
    .from('collections')
    .select('*, folders(name), collaborators(user_id, role)')
    .order('created_at', { ascending: false })
}

export async function getCollection(id: string) {
  return supabase
    .from('collections')
    .select(
      '*, folders(name), collaborators(user_id, role, profiles(display_name, avatar_url))'
    )
    .eq('id', id)
    .single()
}

export async function createCollection(data: NewWabbForm) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  return supabase.from('collections').insert({
    owner_id: user.id,
    folder_id: data.folderId || null,
    title: data.title,
    description: data.description,
    output_type: data.outputType,
    wab_type: data.wabType,
    ranking_mode: data.rankingMode,
    quaternary_labels: data.quaternaryLabels
      ? (JSON.parse(JSON.stringify(data.quaternaryLabels)) as Json)
      : undefined,
    agent_optimization_level: data.agentLevel,
    window_duration: data.windowDuration || null,
    collaboration_mode: data.collaboration || 'solo',
    ravg_formula: data.ravgFormula || 'simple_mean',
    ravg_member_weights: (data.ravgMemberWeights || {}) as Json,
    supervisor_weight: data.supervisorWeight || 1.0,
  })
}

export async function updateCollection(
  id: string,
  fields: Record<string, unknown>
) {
  return supabase.from('collections').update(fields).eq('id', id)
}

export async function moveCollectionToFolder(
  collectionId: string,
  folderId: string | null
) {
  return supabase
    .from('collections')
    .update({ folder_id: folderId })
    .eq('id', collectionId)
}

export async function deleteCollection(id: string) {
  return supabase.from('collections').delete().eq('id', id)
}

export async function branchCollection(
  parentId: string,
  carryOver: BranchCarryOver
) {
  const { data: parent } = await getCollection(parentId)
  if (!parent) throw new Error('Parent collection not found')

  const { data: newCollection, error } = await supabase
    .from('collections')
    .insert({
      owner_id: parent.owner_id,
      folder_id: parent.folder_id,
      title: `${parent.title} (Branch)`,
      description: parent.description,
      output_type: parent.output_type,
      wab_type: parent.wab_type,
      ranking_mode: carryOver.display_features
        ? parent.ranking_mode
        : 'one_axis',
      quaternary_labels: carryOver.display_features
        ? parent.quaternary_labels
        : null,
      agent_optimization_level: carryOver.agent_optimization
        ? parent.agent_optimization_level
        : 'none',
      window_duration: parent.window_duration,
      parent_collection_id: parentId,
      branch_carry_over: JSON.parse(JSON.stringify(carryOver)) as Json,
      current_window: 1,
      collaboration_mode: carryOver.team ? 'team' : 'solo',
      ravg_formula: carryOver.display_features
        ? parent.ravg_formula
        : 'simple_mean',
      ravg_member_weights: ({}) as Json,
      supervisor_weight: 1.0,
    })
    .select()
    .single()

  if (error) return { data: null, error }

  // Copy team (non-owner collaborators) if requested
  if (carryOver.team && newCollection) {
    const { data: collaborators } = await supabase
      .from('collaborators')
      .select('user_id, role')
      .eq('collection_id', parentId)
      .neq('role', 'owner')

    if (collaborators && collaborators.length > 0) {
      await supabase.from('collaborators').insert(
        collaborators.map((c) => ({
          collection_id: newCollection.id,
          user_id: c.user_id,
          role: c.role,
          accepted_at: new Date().toISOString(),
        }))
      )
    }
  }

  // Copy asset library (storage files) if requested
  if (carryOver.asset_library && newCollection) {
    const { data: files } = await supabase.storage
      .from('record-assets')
      .list(parentId)

    if (files && files.length > 0) {
      for (const file of files) {
        const { data: blob } = await supabase.storage
          .from('record-assets')
          .download(`${parentId}/${file.name}`)

        if (blob) {
          await supabase.storage
            .from('record-assets')
            .upload(`${newCollection.id}/${file.name}`, blob)
        }
      }
    }
  }

  return { data: newCollection, error: null }
}
