interface Props {
  onChoice: (choice: string) => void
  disabled?: boolean
}

export function BinaryControls({ onChoice, disabled }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        onClick={() => onChoice('yes')}
        disabled={disabled}
        className="bg-green-500/10 hover:bg-green-500/20 border border-green-500/30
          text-green-400 rounded-xl px-6 py-8 text-xl font-semibold
          transition-all duration-700 hover:scale-[1.02]
          disabled:opacity-50 disabled:hover:scale-100"
      >
        Yes
      </button>
      <button
        onClick={() => onChoice('no')}
        disabled={disabled}
        className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30
          text-red-400 rounded-xl px-6 py-8 text-xl font-semibold
          transition-all duration-700 hover:scale-[1.02]
          disabled:opacity-50 disabled:hover:scale-100"
      >
        No
      </button>
    </div>
  )
}
