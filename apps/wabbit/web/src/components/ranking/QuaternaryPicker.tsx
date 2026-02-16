import type { QuaternaryLabels } from '@/types/app'

interface Props {
  labels?: QuaternaryLabels
  onChoice: (choice: string) => void
  disabled?: boolean
}

const DEFAULT_LABELS: QuaternaryLabels = { a: 'A', b: 'B', c: 'C', d: 'D' }

export function QuaternaryPicker({ labels = DEFAULT_LABELS, onChoice, disabled }: Props) {
  const choices = [
    { key: 'a', label: labels.a },
    { key: 'b', label: labels.b },
    { key: 'c', label: labels.c },
    { key: 'd', label: labels.d },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {choices.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChoice(key)}
          disabled={disabled}
          className="glass-card glass-card-hover p-6 text-center cursor-pointer
            disabled:opacity-50 disabled:hover:scale-100"
        >
          <span className="text-xs text-white/40 uppercase tracking-wider block mb-1">
            {key.toUpperCase()}
          </span>
          <span className="text-lg font-medium">{label}</span>
        </button>
      ))}
    </div>
  )
}
