import { useEffect, useState, useCallback } from 'react'
import { getRecordRankings } from '@/lib/api/rankings'
import {
  calculateRAVG,
  calculateVoteTally,
  type RAVGResult,
  type VoteTallyResult,
  type RankingInput,
  type ChoiceInput,
  type CollaboratorInfo,
  type RAVGConfig,
} from '@/lib/ravg'
import { useRealtime } from '@/hooks/useRealtime'
import type { RankingMode, RAVGFormula } from '@/types/app'

interface CollectionConfig {
  rankingMode: RankingMode
  ravgFormula: RAVGFormula
  ravgMemberWeights: Record<string, number>
  supervisorWeight: number
  ownerId: string
  collaborators: CollaboratorInfo[]
}

interface UseRAVGReturn {
  ravgResult: RAVGResult | null
  voteTally: VoteTallyResult | null
  loading: boolean
  recalculate: () => void
}

export function useRAVG(
  currentRecordId: string | undefined,
  config: CollectionConfig | null
): UseRAVGReturn {
  const [ravgResult, setRavgResult] = useState<RAVGResult | null>(null)
  const [voteTally, setVoteTally] = useState<VoteTallyResult | null>(null)
  const [loading, setLoading] = useState(false)

  const isScoreMode =
    config?.rankingMode === 'one_axis' || config?.rankingMode === 'two_axis'

  const calculate = useCallback(async () => {
    if (!currentRecordId || !config) {
      setRavgResult(null)
      setVoteTally(null)
      return
    }

    setLoading(true)
    const { data } = await getRecordRankings(currentRecordId)

    if (!data || data.length === 0) {
      setRavgResult(null)
      setVoteTally(null)
      setLoading(false)
      return
    }

    if (isScoreMode) {
      const rankings: RankingInput[] = data
        .filter((r) => r.score != null)
        .map((r) => ({ userId: r.user_id, score: r.score! }))

      const ravgConfig: RAVGConfig = {
        formula: config.ravgFormula,
        memberWeights: config.ravgMemberWeights,
        supervisorWeight: config.supervisorWeight,
        ownerId: config.ownerId,
      }

      setRavgResult(calculateRAVG(rankings, config.collaborators, ravgConfig))
      setVoteTally(null)
    } else {
      const choices: ChoiceInput[] = data
        .filter((r) => r.choice != null)
        .map((r) => ({ userId: r.user_id, choice: r.choice! }))

      setVoteTally(calculateVoteTally(choices))
      setRavgResult(null)
    }

    setLoading(false)
  }, [currentRecordId, config, isScoreMode])

  useEffect(() => {
    calculate()
  }, [calculate])

  // Live updates: recalculate when any ranking changes for this record
  useRealtime(
    'rankings',
    currentRecordId ? `record_id=eq.${currentRecordId}` : undefined,
    () => {
      calculate()
    }
  )

  return { ravgResult, voteTally, loading, recalculate: calculate }
}
