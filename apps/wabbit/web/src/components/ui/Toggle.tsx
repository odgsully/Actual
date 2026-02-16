interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, disabled }: Props) {
  return (
    <label className={`flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`
          relative w-10 h-6 rounded-full border transition-all duration-700
          ${checked
            ? 'bg-white/30 border-white/40'
            : 'bg-white/5 border-white/20'
          }
        `}
      >
        <span
          className={`
            absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-700
            ${checked ? 'left-[18px]' : 'left-0.5'}
          `}
        />
      </button>
      {label && <span className="text-sm text-white/80">{label}</span>}
    </label>
  )
}
