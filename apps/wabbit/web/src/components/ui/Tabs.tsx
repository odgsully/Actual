import { clsx } from 'clsx'

interface Tab<T extends string> {
  value: T
  label: string
}

interface Props<T extends string> {
  tabs: Tab<T>[]
  active: T
  onChange: (tab: T) => void
}

export function Tabs<T extends string>({ tabs, active, onChange }: Props<T>) {
  return (
    <div className="flex gap-1 p-1 bg-white/5 rounded-xl overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={clsx(
            'px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-all duration-700',
            active === tab.value
              ? 'bg-white/15 text-white'
              : 'text-white/50 hover:text-white/80 hover:bg-white/5'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
