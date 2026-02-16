interface Props {
  onClick: () => void
}

export function NewWabbButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="glass-button w-full py-2 text-sm flex items-center justify-center gap-1.5"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      New Wabb
    </button>
  )
}
