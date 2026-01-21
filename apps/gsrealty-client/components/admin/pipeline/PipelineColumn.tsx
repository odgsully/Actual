'use client'

import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Card } from '@/components/ui/card'
import { DealCard } from './DealCard'
import type { DealWithClient, DealStage, STAGE_CONFIG } from '@/lib/database/pipeline'

interface PipelineColumnProps {
  stage: DealStage
  config: typeof STAGE_CONFIG[DealStage]
  deals: DealWithClient[]
  onDealClick?: (deal: DealWithClient) => void
  onEditDeal?: (deal: DealWithClient) => void
}

export function PipelineColumn({ stage, config, deals, onDealClick, onEditDeal }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  })

  const totalValue = deals.reduce((sum, d) => sum + (Number(d.deal_value) || 0), 0)
  const formattedTotal = totalValue >= 1000000
    ? `$${(totalValue / 1000000).toFixed(1)}M`
    : totalValue >= 1000
      ? `$${(totalValue / 1000).toFixed(0)}K`
      : `$${totalValue}`

  return (
    <Card
      ref={setNodeRef}
      className={`
        glass-card p-4 min-h-[500px] flex flex-col
        transition-all duration-300
        ${isOver ? 'bg-white/15 border-white/30' : ''}
      `}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <h3 className={`font-semibold ${config.color}`}>
            {config.label}
          </h3>
          <span className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-full">
            {deals.length}
          </span>
        </div>
        <span className="text-xs text-white/40">
          {formattedTotal}
        </span>
      </div>

      {/* Deals List */}
      <SortableContext
        items={deals.map((d) => d.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 space-y-3 overflow-y-auto">
          {deals.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-white/30 text-sm">
              No deals
            </div>
          ) : (
            deals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                onClick={() => onDealClick?.(deal)}
                onEdit={onEditDeal}
              />
            ))
          )}
        </div>
      </SortableContext>
    </Card>
  )
}
