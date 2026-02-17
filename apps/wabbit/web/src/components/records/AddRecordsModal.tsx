import { useState } from 'react'
import { RecordUploader } from './RecordUploader'
import { BulkUploader } from './BulkUploader'
import { RecordForm } from './RecordForm'
import type { OutputType } from '@/types/app'

interface Props {
  collectionId: string
  outputType: OutputType
  currentWindow: number
  onClose: () => void
  onRecordsAdded: () => void
}

type Tab = 'upload' | 'bulk' | 'text'

export function AddRecordsModal({
  collectionId,
  outputType,
  currentWindow,
  onClose,
  onRecordsAdded,
}: Props) {
  const isTextType = outputType === 'text'
  const [activeTab, setActiveTab] = useState<Tab>(isTextType ? 'text' : 'upload')

  const tabs: { key: Tab; label: string; show: boolean }[] = [
    { key: 'upload', label: 'Upload', show: !isTextType },
    { key: 'bulk', label: 'Bulk Upload', show: !isTextType },
    { key: 'text', label: 'Text Entry', show: true },
  ]

  const visibleTabs = tabs.filter((t) => t.show)

  function handleRecordsAdded() {
    onRecordsAdded()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative glass-card p-8 w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Add Records</h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition-colors duration-700"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        {visibleTabs.length > 1 && (
          <div className="flex gap-1 mb-6 p-1 bg-white/5 rounded-xl">
            {visibleTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 text-sm py-2 px-3 rounded-lg transition-all duration-700 ${
                  activeTab === tab.key
                    ? 'bg-white/15 text-white'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Tab content */}
        {activeTab === 'upload' && (
          <RecordUploader
            collectionId={collectionId}
            outputType={outputType}
            currentWindow={currentWindow}
            onUploaded={handleRecordsAdded}
          />
        )}

        {activeTab === 'bulk' && (
          <BulkUploader
            collectionId={collectionId}
            outputType={outputType}
            currentWindow={currentWindow}
            onUploaded={handleRecordsAdded}
          />
        )}

        {activeTab === 'text' && (
          <RecordForm
            collectionId={collectionId}
            currentWindow={currentWindow}
            onCreated={handleRecordsAdded}
          />
        )}
      </div>
    </div>
  )
}
