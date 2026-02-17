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

export async function createRecordWithAsset(data: {
  collectionId: string
  title: string
  description?: string
  file: File
  windowNumber?: number
}) {
  const recordId = crypto.randomUUID()

  // Upload file to storage
  const { error: uploadError } = await uploadRecordAsset(
    data.collectionId,
    recordId,
    data.file
  )
  if (uploadError) return { data: null, error: uploadError }

  // Get public URL for the uploaded file
  const { data: urlData } = supabase.storage
    .from('record-assets')
    .getPublicUrl(`${data.collectionId}/${recordId}/${data.file.name}`)

  // Create record row with storage URL in metadata
  const { error: insertError } = await supabase.from('records').insert({
    id: recordId,
    collection_id: data.collectionId,
    title: data.title,
    description: data.description,
    metadata: JSON.parse(
      JSON.stringify({ sourceUrl: urlData.publicUrl })
    ),
    window_number: data.windowNumber,
  })

  if (insertError) return { data: null, error: insertError }
  return { data: { id: recordId, sourceUrl: urlData.publicUrl }, error: null }
}

export async function bulkCreateRecords(
  items: {
    collectionId: string
    title: string
    file: File
    windowNumber?: number
  }[]
) {
  const results: { id: string; title: string; error?: string }[] = []

  for (const item of items) {
    const result = await createRecordWithAsset(item)
    if (result.error) {
      results.push({ id: '', title: item.title, error: result.error.message })
    } else {
      results.push({ id: result.data!.id, title: item.title })
    }
  }

  return results
}

export function getAssetPublicUrl(
  collectionId: string,
  recordId: string,
  filename: string
) {
  const { data } = supabase.storage
    .from('record-assets')
    .getPublicUrl(`${collectionId}/${recordId}/${filename}`)
  return data.publicUrl
}

export async function deleteRecord(recordId: string, collectionId: string) {
  // List and remove storage files for this record
  const { data: files } = await supabase.storage
    .from('record-assets')
    .list(`${collectionId}/${recordId}`)

  if (files && files.length > 0) {
    const paths = files.map(
      (f) => `${collectionId}/${recordId}/${f.name}`
    )
    await supabase.storage.from('record-assets').remove(paths)
  }

  // Delete the record row
  return supabase.from('records').delete().eq('id', recordId)
}
