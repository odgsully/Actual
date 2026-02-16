import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useCollection } from '@/hooks/useCollection'
import { useRanking } from '@/hooks/useRanking'
import { useRankingStore } from '@/stores/rankingStore'
import { useLayoutStore } from '@/stores/layoutStore'
import { RecordCard } from '@/components/ranking/RecordCard'
import { RankingControls } from '@/components/ranking/RankingControls'
import { WabbSettingsPopup } from '@/components/wabb/WabbSettingsPopup'
import type { RankingMode, QuaternaryLabels } from '@/types/app'

export function WabbPage() {
  const { id } = useParams<{ id: string }>()
  const {
    collection,
    records,
    userRankings,
    loading,
    error,
    firstUnrankedIndex,
    rankedCount,
    totalCount,
    allRanked,
    reload,
  } = useCollection(id)
  const { submitScore, submitChoice, submitting } = useRanking(id)
  const { currentRecordIndex, setCollection: setStoreCollection, nextRecord, previousRecord } =
    useRankingStore()
  const { settingsOpen, toggleSettings, setWabbContext, clearWabbContext } = useLayoutStore()
  const [navigatedToFirst, setNavigatedToFirst] = useState(false)

  // Push wabb context to layout store for TopBar
  useEffect(() => {
    if (collection && id) {
      const counter = `${Math.min(rankedCount + 1, totalCount)} of ${totalCount}`
      setWabbContext(collection.title, counter, id)
    }
    return () => clearWabbContext()
  }, [collection?.title, rankedCount, totalCount, id])

  // Initialize store when collection loads
  useEffect(() => {
    if (id && records.length > 0 && !navigatedToFirst) {
      setStoreCollection(id)
      // Jump to first unranked record
      useRankingStore.setState({ currentRecordIndex: firstUnrankedIndex })
      setNavigatedToFirst(true)
    }
  }, [id, records.length, firstUnrankedIndex, navigatedToFirst])

  // Reset when navigating to a different wabb
  useEffect(() => {
    setNavigatedToFirst(false)
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-white/40">Loading Wabb...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="glass-card p-8 text-center">
          <p className="text-red-400 mb-2">Failed to load</p>
          <p className="text-white/40 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="glass-card p-8 text-center">
          <p className="text-white/60">Wabb not found</p>
        </div>
      </div>
    )
  }

  // "You're All Caught Up" state
  if (allRanked) {
    return (
      <>
        <div className="flex items-center justify-center h-full">
          <div className="glass-card p-12 text-center max-w-md">
            <h2 className="text-3xl font-bold mb-3">You're All Caught Up</h2>
            <p className="text-white/60 mb-6">
              There are no more generations for you to vote on at this time
            </p>
            <Link
              to={`/leaderboard/${id}`}
              className="glass-button inline-block px-6 py-3"
            >
              View Leaderboard
            </Link>
          </div>
        </div>
        {settingsOpen && (
          <WabbSettingsPopup collectionId={id!} onClose={toggleSettings} />
        )}
      </>
    )
  }

  // No records yet
  if (records.length === 0) {
    return (
      <>
        <div className="flex items-center justify-center h-full">
          <div className="glass-card p-12 text-center max-w-md">
            <h2 className="text-2xl font-bold mb-3">{collection.title}</h2>
            <p className="text-white/60">
              No records yet. Add content to start ranking.
            </p>
          </div>
        </div>
        {settingsOpen && (
          <WabbSettingsPopup collectionId={id!} onClose={toggleSettings} />
        )}
      </>
    )
  }

  const currentRecord = records[Math.min(currentRecordIndex, records.length - 1)]
  if (!currentRecord) return null

  const isRanked = userRankings.has(currentRecord.id)

  async function handleScore(score: number) {
    if (!currentRecord) return
    await submitScore(currentRecord.id, score)
    reload()
    nextRecord()
  }

  async function handleChoice(choice: string) {
    if (!currentRecord) return
    await submitChoice(currentRecord.id, choice)
    reload()
    nextRecord()
  }

  function handleSubmit() {
    // For modes that need explicit submit (one_axis, two_axis)
    // The score is already set via onScore, this triggers advance
  }

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Record display */}
        <RecordCard record={currentRecord} outputType={collection.output_type} />

        {/* Ranking controls */}
        <RankingControls
          mode={collection.ranking_mode as RankingMode}
          quaternaryLabels={collection.quaternary_labels as unknown as QuaternaryLabels | undefined}
          onScore={handleScore}
          onChoice={handleChoice}
          onSubmit={handleSubmit}
          disabled={submitting}
        />

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={previousRecord}
            disabled={currentRecordIndex === 0}
            className="text-sm text-white/40 hover:text-white/80 transition-colors duration-700
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {isRanked && (
            <span className="text-xs text-green-400/60">Ranked</span>
          )}

          <button
            onClick={nextRecord}
            disabled={currentRecordIndex >= records.length - 1}
            className="text-sm text-white/40 hover:text-white/80 transition-colors duration-700
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Skip
          </button>
        </div>
      </div>

      {/* Settings popup */}
      {settingsOpen && (
        <WabbSettingsPopup collectionId={id!} onClose={toggleSettings} />
      )}
    </>
  )
}
