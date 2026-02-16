import { useState } from 'react'

interface Props {
  onScore: (score: number) => void
  onSubmit: () => void
  disabled?: boolean
}

export function TwoAxisGrid({ onScore, onSubmit, disabled }: Props) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = 1 - (e.clientY - rect.top) / rect.height
    setPosition({ x, y })
    // Derive score from position: average of x and y, scaled to 0-10
    const score = ((x + y) / 2) * 10
    onScore(Math.round(score * 10) / 10)
  }

  function handleSubmit() {
    if (position) onSubmit()
  }

  return (
    <div className="space-y-4">
      {/* 2D grid */}
      <div
        onClick={disabled ? undefined : handleClick}
        className="relative aspect-square glass-card cursor-crosshair overflow-hidden"
      >
        {/* Quadrant labels */}
        <span className="absolute top-2 left-3 text-xs text-white/20">Low X / High Y</span>
        <span className="absolute top-2 right-3 text-xs text-white/20">High X / High Y</span>
        <span className="absolute bottom-2 left-3 text-xs text-white/20">Low X / Low Y</span>
        <span className="absolute bottom-2 right-3 text-xs text-white/20">High X / Low Y</span>

        {/* Grid lines */}
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-px bg-white/10" />
        </div>
        <div className="absolute inset-0 flex justify-center">
          <div className="h-full w-px bg-white/10" />
        </div>

        {/* Position marker */}
        {position && (
          <div
            className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full
              bg-white shadow-[0_0_12px_rgba(255,255,255,0.4)]
              transition-all duration-300"
            style={{
              left: `${position.x * 100}%`,
              top: `${(1 - position.y) * 100}%`,
            }}
          />
        )}
      </div>

      {/* Score + Submit */}
      {position && (
        <div className="flex items-center gap-4">
          <span className="text-white/60 text-sm">
            Score: {(((position.x + position.y) / 2) * 10).toFixed(1)}
          </span>
          <button
            onClick={handleSubmit}
            disabled={disabled}
            className="flex-1 bg-white/15 hover:bg-white/25 border border-white/20
              text-white rounded-xl px-6 py-3 transition-all duration-700
              hover:scale-[1.02] disabled:opacity-50"
          >
            Submit & Next
          </button>
        </div>
      )}
    </div>
  )
}
