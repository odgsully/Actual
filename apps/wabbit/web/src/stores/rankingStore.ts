import { create } from 'zustand'

interface RankingState {
  collectionId: string | null
  currentRecordIndex: number
  pendingScore: number | null
  pendingChoice: string | null
  rankings: Map<string, number | string>
  setCollection: (id: string) => void
  setPendingScore: (score: number) => void
  setPendingChoice: (choice: string) => void
  submitRanking: (recordId: string, value: number | string) => void
  nextRecord: () => void
  previousRecord: () => void
  goToFirstUnranked: () => void
}

export const useRankingStore = create<RankingState>((set, get) => ({
  collectionId: null,
  currentRecordIndex: 0,
  pendingScore: null,
  pendingChoice: null,
  rankings: new Map(),

  setCollection: (id) => set({ collectionId: id, currentRecordIndex: 0 }),

  setPendingScore: (score) => set({ pendingScore: score, pendingChoice: null }),

  setPendingChoice: (choice) => set({ pendingChoice: choice, pendingScore: null }),

  submitRanking: (recordId, value) => {
    const rankings = new Map(get().rankings)
    rankings.set(recordId, value)
    set({ rankings, pendingScore: null, pendingChoice: null })
  },

  nextRecord: () => set((s) => ({ currentRecordIndex: s.currentRecordIndex + 1 })),

  previousRecord: () =>
    set((s) => ({ currentRecordIndex: Math.max(0, s.currentRecordIndex - 1) })),

  goToFirstUnranked: () => {
    // Will be implemented with record data in Wave 2
    set({ currentRecordIndex: 0 })
  },
}))
