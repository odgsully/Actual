import { z } from 'zod'
import { ACCEPTED_FORMATS, MAX_FILE_SIZE } from '@/types/app'
import type { OutputType } from '@/types/app'

export function validateFileType(file: File, outputType: OutputType): boolean {
  const extensions = ACCEPTED_FORMATS[outputType]
  if (extensions.length === 0) return false // text type has no file upload
  const name = file.name.toLowerCase()
  return extensions.some((ext) => name.endsWith(ext))
}

export function validateFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE
}

export const recordUploadSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
})

export const textRecordSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  body: z.string().min(1, 'Content is required'),
})

export type RecordUploadFormData = z.infer<typeof recordUploadSchema>
export type TextRecordFormData = z.infer<typeof textRecordSchema>
