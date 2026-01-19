'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Home, Calendar, GripVertical, Pencil } from 'lucide-react'
import type { DealWithClient } from '@/lib/database/pipeline'

interface DealCardProps {
  deal: DealWithClient
  onClick?: () => void
  onEdit?: (deal: DealWithClient) => void
}

export function DealCard({ deal, onClick, onEdit }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const clientName = deal.client
    ? `${deal.client.first_name} ${deal.client.last_name}`
    : 'Unknown Client'

  const formattedValue = deal.deal_value
    ? deal.deal_value >= 1000000
      ? `$${(deal.deal_value / 1000000).toFixed(1)}M`
      : `$${(deal.deal_value / 1000).toFixed(0)}K`
    : '$0'

  const formattedCommission = deal.expected_commission
    ? `$${(Number(deal.expected_commission) / 1000).toFixed(1)}K`
    : '$0'

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`
        bg-white/5 border border-white/10 rounded-xl p-4
        hover:bg-white/10 transition-all duration-300
        ${isDragging ? 'opacity-50 shadow-2xl scale-105' : ''}
        cursor-grab active:cursor-grabbing
      `}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="mt-1 text-white/30 hover:text-white/60 cursor-grab"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Client Name & Type Badge */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <h4 className="font-semibold text-white text-sm truncate">
              {clientName}
            </h4>
            <div className="flex items-center gap-1.5 shrink-0">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(deal)
                  }}
                  className="p-1 hover:bg-white/20 rounded-md transition-colors group"
                  title="Edit deal"
                >
                  <Pencil className="h-3 w-3 text-white/40 group-hover:text-white/80" />
                </button>
              )}
              <Badge
                className={`text-xs ${
                  deal.type === 'buyer'
                    ? 'bg-blue-500/20 text-blue-400 border-blue-400/30'
                    : 'bg-pink-500/20 text-pink-400 border-pink-400/30'
                }`}
              >
                {deal.type === 'buyer' ? 'Buyer' : 'Seller'}
              </Badge>
            </div>
          </div>

          {/* Property Address */}
          {deal.property_address && (
            <div className="flex items-center gap-1.5 text-white/60 text-xs mb-2">
              <Home className="h-3 w-3 shrink-0" />
              <span className="truncate">{deal.property_address}</span>
            </div>
          )}

          {/* Value & Commission */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-white/80">
              <DollarSign className="h-3 w-3" />
              <span className="font-medium">{formattedValue}</span>
            </div>
            <span className="text-green-400 font-medium">
              {formattedCommission} comm
            </span>
          </div>

          {/* Representation End Date */}
          {deal.representation_end_date && (
            <div className="flex items-center gap-1.5 text-white/40 text-xs mt-2">
              <Calendar className="h-3 w-3" />
              <span>
                Ends {new Date(deal.representation_end_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
