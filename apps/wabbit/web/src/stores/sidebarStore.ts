import { create } from 'zustand'

type OutputType = 'image' | 'video' | 'text' | '3d' | 'audio' | 'deck'
type SortOrder = 'start_date' | 'window_finish' | 'branches' | 'alpha' | 'progress'

interface SidebarState {
  expandedFolders: Set<string>
  activeFilters: Set<OutputType>
  sortOrder: SortOrder
  searchQuery: string
  selectedWabbId: string | null
  toggleFolder: (folderId: string) => void
  setFilters: (filters: Set<OutputType>) => void
  setSortOrder: (order: SortOrder) => void
  setSearchQuery: (query: string) => void
  selectWabb: (wabbId: string) => void
}

export const useSidebarStore = create<SidebarState>((set, get) => ({
  expandedFolders: new Set(),
  activeFilters: new Set(),
  sortOrder: 'start_date',
  searchQuery: '',
  selectedWabbId: null,

  toggleFolder: (folderId) => {
    const expanded = new Set(get().expandedFolders)
    if (expanded.has(folderId)) {
      expanded.delete(folderId)
    } else {
      expanded.add(folderId)
    }
    set({ expandedFolders: expanded })
  },

  setFilters: (filters) => set({ activeFilters: filters }),
  setSortOrder: (order) => set({ sortOrder: order }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  selectWabb: (wabbId) => set({ selectedWabbId: wabbId }),
}))
