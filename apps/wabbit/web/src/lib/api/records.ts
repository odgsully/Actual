import { supabase } from '@/lib/supabase'

export async function getRecords(collectionId: string) {
  return supabase
    .from('records')
    .select('*')
    .eq('collection_id', collectionId)
    .order('sort_order')
}

export async function getRecordsByWindow(
  collectionId: string,
  windowNumber: number
) {
  return supabase
    .from('records')
    .select('*')
    .eq('collection_id', collectionId)
    .eq('window_number', windowNumber)
    .order('sort_order')
}

export async function createRecord(data: {
  collectionId: string
  title: string
  description?: string
  metadata?: { [key: string]: unknown }
  windowNumber?: number
}) {
  return supabase.from('records').insert({
    collection_id: data.collectionId,
    title: data.title,
    description: data.description,
    metadata: JSON.parse(JSON.stringify(data.metadata || {})),
    window_number: data.windowNumber,
  })
}

export async function uploadRecordAsset(
  collectionId: string,
  recordId: string,
  file: File
) {
  const path = `${collectionId}/${recordId}/${file.name}`
  return supabase.storage.from('record-assets').upload(path, file)
}
