import { useState } from 'react'

interface Props {
  onScore: (score: number) => void
  onSubmit: () => void
  disabled?: boolean
  initialValue?: number
}

export function OneAxisSlider({ onScore, onSubmit, disabled, initialValue }: Props) {
  const [value, setValue] = useState(initialValue ?? 5.0)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const score = parseFloat(e.target.value)
    setValue(score)
    onScore(score)
  }

  function handleSubmit() {
    onScore(value)
    onSubmit()
  }

  const isKeyScore = [0, 1, 5, 9, 10].includes(Math.round(value))

  return (
    <div className="space-y-4">
      {/* Score display */}
      <div className="text-center">
        <span
          className={`text-5xl font-bold tabular-nums transition-all duration-700 ${
            isKeyScore ? 'scale-110 text-white' : 'text-white/80'
          }`}
        >
          {value.toFixed(1)}
        </span>
      </div>

      {/* Slider */}
      <div className="px-2">
        <input
          type="range"
          min="0"
          max="10"
          step="0.1"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="w-full h-2 rounded-full appearance-none cursor-pointer
            bg-white/10 accent-white/80
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(255,255,255,0.3)]
            [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-700"
        />
        <div className="flex justify-between text-xs text-white/30 mt-1 px-1">
          <span>0</span>
          <span>5</span>
          <span>10</span>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={disabled}
        className="w-full bg-white/15 hover:bg-white/25 border border-white/20
          text-white rounded-xl px-6 py-3 transition-all duration-700
          hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
      >
        Submit & Next
      </button>
    </div>
  )
}
