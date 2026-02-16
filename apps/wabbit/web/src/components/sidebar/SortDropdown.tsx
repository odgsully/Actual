import { useSidebarStore } from '@/stores/sidebarStore'

const SORT_OPTIONS = [
  { value: 'start_date', label: 'Newest' },
  { value: 'alpha', label: 'A-Z' },
  { value: 'progress', label: 'Progress' },
  { value: 'window_finish', label: 'Window End' },
  { value: 'branches', label: 'Branches' },
] as const

export function SortDropdown() {
  const { sortOrder, setSortOrder } = useSidebarStore()

  return (
    <select
      value={sortOrder}
      onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
      className="glass-input text-xs py-1 px-2 bg-transparent cursor-pointer"
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-[#0a0a0f]">
          {opt.label}
        </option>
      ))}
    </select>
  )
}
