import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useSidebarStore } from '@/stores/sidebarStore'
import { updateFolder, deleteFolder } from '@/lib/api/folders'
import { WabbItem } from './WabbItem'
import { ContextMenu } from './ContextMenu'
import type { Database } from '@/types/database'

type Folder = Database['public']['Tables']['folders']['Row']
type Collection = Database['public']['Tables']['collections']['Row']

interface Props {
  folder: Folder
  collections: Collection[]
  progressMap: Map<string, number>
  onRefresh: () => void
}

export function FolderItem({ folder, collections, progressMap, onRefresh }: Props) {
  const { expandedFolders, toggleFolder } = useSidebarStore()
  const isExpanded = expandedFolders.has(folder.id)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(folder.name)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: folder.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  async function handleRename() {
    if (newName.trim() && newName !== folder.name) {
      await updateFolder(folder.id, { name: newName.trim() })
      onRefresh()
    }
    setRenaming(false)
  }

  async function handleDelete() {
    if (confirm(`Delete "${folder.name}"? Wabbs inside will become Unfiled.`)) {
      await deleteFolder(folder.id)
      onRefresh()
    }
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div onContextMenu={handleContextMenu}>
        {renaming ? (
          <div className="flex items-center gap-1 px-3 py-1.5">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') setRenaming(false)
              }}
              className="glass-input text-sm flex-1 py-0.5 px-2"
            />
          </div>
        ) : (
          <button
            onClick={() => toggleFolder(folder.id)}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl
              text-white/60 hover:text-white hover:bg-white/5
              transition-all duration-700 text-sm"
            {...attributes}
            {...listeners}
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-300 ${
                isExpanded ? 'rotate-90' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span className="flex-1 text-left truncate">{folder.name}</span>
            <span className="text-xs text-white/30">{collections.length}</span>
          </button>
        )}
      </div>

      {isExpanded && collections.length > 0 && (
        <div className="ml-4 mt-0.5 space-y-0.5">
          {collections.map((c) => (
            <WabbItem
              key={c.id}
              collection={c}
              progressPct={progressMap.get(c.id) ?? 0}
            />
          ))}
        </div>
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            { label: 'Rename', onClick: () => setRenaming(true) },
            { label: 'Delete', onClick: handleDelete, danger: true },
          ]}
        />
      )}
    </div>
  )
}
