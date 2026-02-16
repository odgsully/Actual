function getProgressColor(pct: number): string {
  if (pct >= 100) return 'bg-green-700'
  if (pct >= 70) return 'bg-green-400'
  if (pct >= 40) return 'bg-blue-400'
  if (pct >= 20) return 'bg-yellow-400'
  return 'bg-orange-400'
}

interface Props {
  percentage: number
}

export function ProgressDot({ percentage }: Props) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${getProgressColor(percentage)}`}
      title={`${Math.round(percentage)}% ranked`}
    />
  )
}
