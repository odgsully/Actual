import { z } from 'zod'

export const newWabbSchema = z.object({
  title: z.string().min(1, 'Name is required'),
  folderId: z.string().uuid().nullable().optional(),
  description: z.string().optional(),
  outputType: z.enum(['image', 'video', 'text', '3d', 'audio', 'deck']),
  wabType: z.enum(['standard', 'vetted_ref']).default('standard'),
  rankingMode: z
    .enum(['one_axis', 'two_axis', 'quaternary', 'binary'])
    .default('one_axis'),
  quaternaryLabels: z
    .object({
      a: z.string().default('A'),
      b: z.string().default('B'),
      c: z.string().default('C'),
      d: z.string().default('D'),
    })
    .optional(),
  agentLevel: z.enum(['none', 'low', 'medium', 'high']).default('none'),
  windowDuration: z.string().nullable().optional(),
  ravgFormula: z
    .enum(['simple_mean', 'weighted_by_role', 'exclude_outliers', 'custom'])
    .default('simple_mean'),
  collaboration: z.enum(['solo', 'team']).default('solo'),
})

export type NewWabbFormData = z.infer<typeof newWabbSchema>
