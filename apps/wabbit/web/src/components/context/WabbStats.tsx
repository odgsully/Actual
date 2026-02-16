interface Props {
  totalRecords: number
  rankedByUser: number
  currentWindow: number | null
  windowDuration: string | null
}

export function WabbStats({ totalRecords, rankedByUser, currentWindow, windowDuration }: Props) {
  const userPct = totalRecords > 0 ? Math.round((rankedByUser / totalRecords) * 100) : 0

  return (
    <div className="glass-card p-4 space-y-3">
      <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider">
        Stats
      </h4>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-2xl font-bold tabular-nums">{totalRecords}</p>
          <p className="text-[10px] text-white/40 uppercase">Records</p>
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums">
            {rankedByUser}
            <span className="text-sm text-white/30 ml-1">({userPct}%)</span>
          </p>
          <p className="text-[10px] text-white/40 uppercase">Your Ranked</p>
        </div>
      </div>

      {currentWindow != null && (
        <div className="pt-2 border-t border-white/10">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/40">Window</span>
            <span className="text-white/60">
              #{currentWindow}
              {windowDuration ? ` · ${windowDuration}` : ' · No expiration'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
