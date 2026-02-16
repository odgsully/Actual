import type { RAVGResult, VoteTallyResult } from '@/lib/ravg'
import type { RAVGFormula, RankingMode } from '@/types/app'

interface Props {
  rankingMode: RankingMode
  ravgFormula: RAVGFormula
  supervisorWeight: number
  ravgResult: RAVGResult | null
  voteTally: VoteTallyResult | null
}

const FORMULA_LABELS: Record<string, string> = {
  simple_mean: 'Mean',
  weighted_by_role: 'Weighted',
  exclude_outliers: 'Trimmed',
  custom: 'Custom',
}

export function RAVGDisplay({
  rankingMode,
  ravgFormula,
  supervisorWeight,
  ravgResult,
  voteTally,
}: Props) {
  const isScoreMode = rankingMode === 'one_axis' || rankingMode === 'two_axis'
  const hasSuperRAVG = ravgResult?.superRAVG != null

  if (isScoreMode) {
    return (
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider">
            {hasSuperRAVG ? 'Team RAVG' : 'RAVG Score'}
          </h4>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50">
            {FORMULA_LABELS[ravgFormula] ?? ravgFormula}
          </span>
        </div>

        <div className="text-center">
          <span className="text-4xl font-bold tabular-nums">
            {ravgResult ? ravgResult.teamRAVG.toFixed(1) : '—'}
          </span>
          <span className="text-white/40 text-sm ml-1">/ 10</span>
        </div>

        <div className="text-xs text-white/30 text-center">
          {ravgResult?.rankCount ?? 0} contributor
          {ravgResult?.rankCount !== 1 ? 's' : ''}
        </div>

        {hasSuperRAVG && (
          <div className="pt-3 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/40">Super RAVG</span>
              <span className="text-white/60">{supervisorWeight}x owner weight</span>
            </div>
            <div className="text-center">
              <span className="text-3xl font-bold tabular-nums text-yellow-400">
                {ravgResult!.superRAVG!.toFixed(1)}
              </span>
              <span className="text-white/40 text-sm ml-1">/ 10</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Choice-based mode: show vote tallies
  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider">
          Vote Tally
        </h4>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50">
          {voteTally?.total ?? 0} vote{voteTally?.total !== 1 ? 's' : ''}
        </span>
      </div>

      {voteTally && voteTally.total > 0 ? (
        <div className="space-y-2">
          {Object.entries(voteTally.tally)
            .sort(([, a], [, b]) => b - a)
            .map(([choice, count]) => {
              const pct = Math.round((count / voteTally.total) * 100)
              const isWinner = choice === voteTally.winner

              return (
                <div key={choice} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`capitalize ${
                        isWinner ? 'text-white font-medium' : 'text-white/60'
                      }`}
                    >
                      {choice}
                    </span>
                    <span className="text-white/40 tabular-nums">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        isWinner ? 'bg-yellow-400/60' : 'bg-white/20'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
        </div>
      ) : (
        <p className="text-white/30 text-sm text-center py-2">No votes yet.</p>
      )}
    </div>
  )
}
