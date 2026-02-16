import { useSidebarStore } from '@/stores/sidebarStore'
import type { OutputType } from '@/types/app'

const FILTERS: { value: OutputType; label: string }[] = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'text', label: 'Text' },
  { value: '3d', label: '3D' },
  { value: 'audio', label: 'Audio' },
  { value: 'deck', label: 'Deck' },
]

export function FilterChips() {
  const { activeFilters, setFilters } = useSidebarStore()

  function toggle(type: OutputType) {
    const next = new Set(activeFilters)
    if (next.has(type)) {
      next.delete(type)
    } else {
      next.add(type)
    }
    setFilters(next)
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {FILTERS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => toggle(value)}
          className={`text-xs px-2.5 py-1 rounded-lg border transition-all duration-700 ${
            activeFilters.has(value)
              ? 'bg-white/20 border-white/30 text-white'
              : 'bg-transparent border-white/10 text-white/40 hover:text-white/60 hover:border-white/20'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
