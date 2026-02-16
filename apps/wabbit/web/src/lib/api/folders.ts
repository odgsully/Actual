import { supabase } from '@/lib/supabase'

export async function getFolders() {
  return supabase.from('folders').select('*').order('sort_order')
}

export async function createFolder(name: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return supabase.from('folders').insert({ owner_id: user.id, name })
}

export async function updateFolder(
  id: string,
  data: { name?: string; sort_order?: number }
) {
  return supabase.from('folders').update(data).eq('id', id)
}

export async function deleteFolder(id: string) {
  return supabase.from('folders').delete().eq('id', id)
}

export async function reorderFolders(orderedIds: string[]) {
  const updates = orderedIds.map((id, index) =>
    supabase.from('folders').update({ sort_order: index }).eq('id', id)
  )
  return Promise.all(updates)
}
