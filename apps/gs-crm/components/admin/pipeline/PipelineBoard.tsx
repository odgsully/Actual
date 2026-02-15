'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
// Note: arrayMove from @dnd-kit/sortable could be used for position reordering within columns
// Position persistence is not currently implemented - only stage changes are saved
import { PipelineColumn } from './PipelineColumn'
import { DealCard } from './DealCard'
import {
  getDealsByStage,
  STAGE_CONFIG,
  STAGES,
  type DealStage,
  type DealType,
  type DealWithClient,
} from '@/lib/database/pipeline'
import { updateDealStage, batchUpdateDealStages } from '@/lib/actions/pipeline'

interface PipelineBoardProps {
  dealType: DealType | 'all'
  onDealClick?: (deal: DealWithClient) => void
  onEditDeal?: (deal: DealWithClient) => void
}

export function PipelineBoard({ dealType, onDealClick, onEditDeal }: PipelineBoardProps) {
  const [dealsByStage, setDealsByStage] = useState<Record<DealStage, DealWithClient[]>>({
    on_radar: [],
    official_representation: [],
    touring: [],
    offers_in: [],
    under_contract: [],
    closed: [],
  })
  const [loading, setLoading] = useState(true)
  const [activeDeal, setActiveDeal] = useState<DealWithClient | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Fetch deals
  const fetchDeals = useCallback(async () => {
    setLoading(true)
    const type = dealType === 'all' ? undefined : dealType
    const { dealsByStage: data } = await getDealsByStage(type)
    setDealsByStage(data)
    setLoading(false)
  }, [dealType])

  useEffect(() => {
    fetchDeals()
  }, [fetchDeals])

  // Clear error after 3 seconds
  useEffect(() => {
    if (updateError) {
      const timer = setTimeout(() => setUpdateError(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [updateError])

  // Find which stage a deal is in
  const findDealStage = (dealId: string): DealStage | null => {
    for (const stage of STAGES) {
      if (dealsByStage[stage].some((d) => d.id === dealId)) {
        return stage
      }
    }
    return null
  }

  // Find a deal by ID
  const findDeal = (dealId: string): DealWithClient | null => {
    for (const stage of STAGES) {
      const deal = dealsByStage[stage].find((d) => d.id === dealId)
      if (deal) return deal
    }
    return null
  }

  const handleDragStart = (event: DragStartEvent) => {
    const deal = findDeal(event.active.id as string)
    setActiveDeal(deal)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeStage = findDealStage(activeId)

    // Check if we're over a column (stage) or another deal
    let overStage: DealStage | null = null

    if (STAGES.includes(overId as DealStage)) {
      // Dropping directly on a column
      overStage = overId as DealStage
    } else {
      // Dropping on another deal
      overStage = findDealStage(overId)
    }

    if (!activeStage || !overStage || activeStage === overStage) return

    // Move deal to new stage
    setDealsByStage((prev) => {
      const activeDeal = prev[activeStage].find((d) => d.id === activeId)
      if (!activeDeal) return prev

      return {
        ...prev,
        [activeStage]: prev[activeStage].filter((d) => d.id !== activeId),
        [overStage]: [...prev[overStage], { ...activeDeal, stage: overStage }],
      }
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDeal(null)
    setUpdateError(null)

    if (!over) {
      // No drop target - refetch to revert UI changes from handleDragOver
      await fetchDeals()
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    // Determine the target stage from where we dropped
    let targetStage: DealStage | null = null

    if (STAGES.includes(overId as DealStage)) {
      // Dropped directly on a column
      targetStage = overId as DealStage
    } else {
      // Dropped on a deal - find what stage that deal is in
      targetStage = findDealStage(overId)
    }

    if (!targetStage) {
      await fetchDeals()
      return
    }

    // Use server action to update the deal stage
    console.log('[PipelineBoard] Updating deal:', activeId, 'to stage:', targetStage)
    const { success, error } = await updateDealStage(activeId, targetStage)

    if (!success) {
      console.error('[PipelineBoard] Failed to update deal stage:', error)
      setUpdateError(error || 'Failed to move deal. Refreshing...')
      // Revert UI by refetching from database
      await fetchDeals()
    } else {
      console.log('[PipelineBoard] Successfully updated deal stage')
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {STAGES.map((stage) => (
          <div
            key={stage}
            className="glass-card p-4 min-h-[500px] animate-pulse"
          >
            <div className="h-6 bg-white/10 rounded mb-4" />
            <div className="space-y-3">
              <div className="h-24 bg-white/5 rounded-xl" />
              <div className="h-24 bg-white/5 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* Error Toast */}
      {updateError && (
        <div className="fixed top-4 right-4 z-50 bg-red-500/90 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2">
          <span className="text-sm font-medium">{updateError}</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {STAGES.map((stage) => (
          <PipelineColumn
            key={stage}
            stage={stage}
            config={STAGE_CONFIG[stage]}
            deals={dealsByStage[stage]}
            onDealClick={onDealClick}
            onEditDeal={onEditDeal}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDeal ? (
          <div className="opacity-80">
            <DealCard deal={activeDeal} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
