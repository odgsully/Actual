import { useNavigate } from 'react-router-dom'
import { ProgressDot } from './ProgressDot'
import { useSidebarStore } from '@/stores/sidebarStore'
import type { Database } from '@/types/database'

type Collection = Database['public']['Tables']['collections']['Row']

const OUTPUT_ICONS: Record<string, string> = {
  image: '🖼',
  video: '🎬',
  text: '📝',
  '3d': '🧊',
  audio: '🔊',
  deck: '📊',
}

interface Props {
  collection: Collection
  progressPct: number
}

export function WabbItem({ collection, progressPct }: Props) {
  const navigate = useNavigate()
  const { selectedWabbId, selectWabb } = useSidebarStore()
  const isActive = selectedWabbId === collection.id

  function handleClick() {
    selectWabb(collection.id)
    navigate(`/wabb/${collection.id}`)
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl
        transition-all duration-700 text-sm
        ${isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
    >
      <span className="text-base flex-shrink-0">
        {OUTPUT_ICONS[collection.output_type] ?? '📄'}
      </span>
      <span className="flex-1 min-w-0 truncate">{collection.title}</span>
      <ProgressDot percentage={progressPct} />
    </button>
  )
}
