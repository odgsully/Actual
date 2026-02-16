import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Tabs } from '@/components/ui/Tabs'
import { getCollection } from '@/lib/api/collections'
import { getCollaborators } from '@/lib/api/collaborators'
import { OverviewTab } from './settings/OverviewTab'
import { RankingTab } from './settings/RankingTab'
import { TeamTab } from './settings/TeamTab'
import { WindowTab } from './settings/WindowTab'
import { BranchTab } from './settings/BranchTab'
import { AgentTab } from './settings/AgentTab'
import type { SettingsTab } from '@/types/app'
import type { Database } from '@/types/database'

type Collection = Database['public']['Tables']['collections']['Row']

interface Collaborator {
  id: string
  user_id: string
  role: string
  profiles: {
    display_name: string | null
    avatar_url: string | null
  } | null
}

interface Props {
  collectionId: string
  onClose: () => void
}

const TABS: { value: SettingsTab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'ranking', label: 'Ranking' },
  { value: 'team', label: 'Team' },
  { value: 'window', label: 'Window' },
  { value: 'branch', label: 'Branch' },
  { value: 'agent', label: 'Agent' },
]

export function WabbSettingsPopup({ collectionId, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('overview')
  const [collection, setCollection] = useState<Collection | null>(null)
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getCollection(collectionId),
      getCollaborators(collectionId),
    ]).then(([collRes, collabRes]) => {
      setCollection(collRes.data)
      setCollaborators((collabRes.data ?? []) as unknown as Collaborator[])
      setLoading(false)
    })
  }, [collectionId])

  function handleCollectionUpdate(updated: Partial<Collection>) {
    if (collection) {
      setCollection({ ...collection, ...updated })
    }
  }

  return (
    <Modal open onClose={onClose} maxWidth="max-w-2xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Wabb Settings</h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition-colors duration-700"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="animate-pulse text-white/40">Loading settings...</div>
          </div>
        ) : collection ? (
          <div className="min-h-[300px]">
            {activeTab === 'overview' && (
              <OverviewTab collection={collection} onUpdate={handleCollectionUpdate} />
            )}
            {activeTab === 'ranking' && (
              <RankingTab collection={collection} onUpdate={handleCollectionUpdate} />
            )}
            {activeTab === 'team' && (
              <TeamTab collectionId={collectionId} collaborators={collaborators} onRefresh={() => {
                getCollaborators(collectionId).then(({ data }) => {
                  setCollaborators((data ?? []) as unknown as Collaborator[])
                })
              }} />
            )}
            {activeTab === 'window' && (
              <WindowTab collection={collection} onUpdate={handleCollectionUpdate} />
            )}
            {activeTab === 'branch' && (
              <BranchTab collection={collection} />
            )}
            {activeTab === 'agent' && (
              <AgentTab collection={collection} onUpdate={handleCollectionUpdate} />
            )}
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
