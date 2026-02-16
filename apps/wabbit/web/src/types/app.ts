export type OutputType = 'image' | 'video' | 'text' | '3d' | 'audio' | 'deck'
export type WabType = 'standard' | 'vetted_ref'
export type RankingMode = 'one_axis' | 'two_axis' | 'quaternary' | 'binary'
export type CollaboratorRole = 'owner' | 'contributor' | 'viewer'
export type AgentOptimizationLevel = 'none' | 'low' | 'medium' | 'high'
export type RAVGFormula = 'simple_mean' | 'weighted_by_role' | 'exclude_outliers' | 'custom'

export interface QuaternaryLabels {
  a: string
  b: string
  c: string
  d: string
}

export interface BranchCarryOver {
  asset_library: boolean
  display_features: boolean
  team: boolean
  context_docs: boolean
  agent_optimization: boolean
  notification_preferences: boolean
}

// Settings popup tab identifiers
export type SettingsTab = 'overview' | 'ranking' | 'team' | 'window' | 'branch' | 'agent'

// Media metadata types for records
export interface VideoChapter {
  time: number
  label: string
}

export interface VideoMetadata {
  video_url: string
  chapters?: VideoChapter[]
}

export interface LayerEntry {
  name: string
  visible: boolean
}

export interface LayerMetadata {
  image_url: string
  layers: LayerEntry[]
}

export interface NewWabbForm {
  title: string
  folderId?: string | null
  description?: string
  outputType: OutputType
  wabType: WabType
  rankingMode: RankingMode
  quaternaryLabels?: QuaternaryLabels
  agentLevel: AgentOptimizationLevel
  windowDuration?: string | null
  ravgFormula: RAVGFormula
  ravgMemberWeights?: Record<string, number>
  supervisorWeight?: number
  collaboration: 'solo' | 'team'
}
