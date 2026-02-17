import { useLayoutStore } from '@/stores/layoutStore'

export function TopBar() {
  const {
    toggleContextPanel,
    toggleMobileDrawer,
    toggleSettings,
    toggleAddRecords,
    contextPanelOpen,
    wabbTitle,
    recordCounter,
    activeWabbId,
    canAddRecords,
  } = useLayoutStore()

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-white/10 flex-shrink-0">
      {/* Mobile hamburger */}
      <button
        onClick={toggleMobileDrawer}
        className="lg:hidden text-white/60 hover:text-white transition-colors duration-700"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Wabb title + counter */}
      <div className="flex-1 min-w-0 px-4 lg:px-0 flex items-center gap-3">
        <h2 className="text-sm font-medium text-white truncate">
          {wabbTitle ?? <span className="text-white/60">Select a Wabb to get started</span>}
        </h2>
        {recordCounter && (
          <span className="text-xs text-white/40 flex-shrink-0">{recordCounter}</span>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Add Records — only for owner/contributor */}
        {activeWabbId && canAddRecords && (
          <button
            onClick={toggleAddRecords}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-all duration-700"
            title="Add Records"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add
          </button>
        )}

        {/* Settings gear — only when a wabb is active */}
        {activeWabbId && (
          <button
            onClick={toggleSettings}
            className="text-white/40 hover:text-white/80 transition-all duration-700 p-1.5 rounded-lg hover:bg-white/5"
            title="Wabb Settings"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}

        {/* Context panel toggle */}
        <button
          onClick={toggleContextPanel}
          className={`hidden lg:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all duration-700 ${
            contextPanelOpen
              ? 'bg-white/15 text-white'
              : 'text-white/40 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
          </svg>
          Details
        </button>
      </div>
    </header>
  )
}
