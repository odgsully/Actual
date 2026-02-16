import { useEffect, useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { getFolders } from '@/lib/api/folders'
import { getCollections, moveCollectionToFolder } from '@/lib/api/collections'
import { reorderFolders } from '@/lib/api/folders'
import { useSidebarStore } from '@/stores/sidebarStore'
import { useProgress } from '@/hooks/useProgress'
import { FolderItem } from './FolderItem'
import { WabbItem } from './WabbItem'
import { SearchInput } from './SearchInput'
import { FilterChips } from './FilterChips'
import { SortDropdown } from './SortDropdown'
import type { Database } from '@/types/database'

type Folder = Database['public']['Tables']['folders']['Row']
type Collection = Database['public']['Tables']['collections']['Row']

export function FolderTree() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const { searchQuery, activeFilters, sortOrder } = useSidebarStore()
  const { progress } = useProgress()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const load = useCallback(async () => {
    const [fRes, cRes] = await Promise.all([getFolders(), getCollections()])
    setFolders(fRes.data ?? [])
    setCollections(cRes.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Filter collections
  let filtered = collections
  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    filtered = filtered.filter((c) => c.title.toLowerCase().includes(q))
  }
  if (activeFilters.size > 0) {
    filtered = filtered.filter((c) =>
      activeFilters.has(c.output_type as never)
    )
  }

  // Sort collections
  filtered = [...filtered].sort((a, b) => {
    switch (sortOrder) {
      case 'alpha':
        return a.title.localeCompare(b.title)
      case 'progress': {
        const pa = progress.get(a.id)?.completion_pct ?? 0
        const pb = progress.get(b.id)?.completion_pct ?? 0
        return pb - pa
      }
      default:
        return (
          new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
        )
    }
  })

  // Group by folder
  const foldered = new Map<string, Collection[]>()
  const unfiled: Collection[] = []

  for (const c of filtered) {
    if (c.folder_id) {
      const list = foldered.get(c.folder_id) ?? []
      list.push(c)
      foldered.set(c.folder_id, list)
    } else {
      unfiled.push(c)
    }
  }

  // Progress map
  const progressMap = new Map<string, number>()
  for (const [id, entry] of progress) {
    progressMap.set(id, entry.completion_pct)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = String(active.id)
    const overId = String(over.id)

    // Check if dragging a folder (reorder folders)
    const activeFolderIdx = folders.findIndex((f) => f.id === activeId)
    const overFolderIdx = folders.findIndex((f) => f.id === overId)

    if (activeFolderIdx !== -1 && overFolderIdx !== -1) {
      const reordered = arrayMove(folders, activeFolderIdx, overFolderIdx)
      setFolders(reordered)
      await reorderFolders(reordered.map((f) => f.id))
      return
    }

    // Check if dragging a wabb onto a folder (move to folder)
    const isWabb = collections.some((c) => c.id === activeId)
    const targetFolder = folders.find((f) => f.id === overId)

    if (isWabb && targetFolder) {
      await moveCollectionToFolder(activeId, targetFolder.id)
      load()
    }
  }

  if (loading) {
    return (
      <div className="p-2 text-white/30 text-sm animate-pulse">Loading...</div>
    )
  }

  return (
    <div className="space-y-3">
      <SearchInput />

      <div className="flex items-center gap-2">
        <FilterChips />
        <SortDropdown />
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={folders.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {folders.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                collections={foldered.get(folder.id) ?? []}
                progressMap={progressMap}
                onRefresh={load}
              />
            ))}
          </div>
        </SortableContext>

        {/* Unfiled */}
        {unfiled.length > 0 && (
          <div>
            <p className="text-xs text-white/30 px-3 mb-1">Unfiled</p>
            <div className="space-y-0.5">
              {unfiled.map((c) => (
                <WabbItem
                  key={c.id}
                  collection={c}
                  progressPct={progressMap.get(c.id) ?? 0}
                />
              ))}
            </div>
          </div>
        )}
      </DndContext>

      {filtered.length === 0 && (
        <p className="text-white/30 text-sm px-3">
          {searchQuery || activeFilters.size > 0
            ? 'No matching Wabbs'
            : 'No Wabbs yet'}
        </p>
      )}
    </div>
  )
}
