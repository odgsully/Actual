import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { ContextPanel } from './ContextPanel'
import { useLayoutStore } from '@/stores/layoutStore'

export function AppLayout() {
  const { contextPanelOpen, mobileDrawerOpen, toggleMobileDrawer, toggleContextPanel } =
    useLayoutStore()

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Mobile sidebar overlay */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleMobileDrawer}
        />
      )}

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar — 280px on desktop, drawer on mobile */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-50
            w-[280px] flex-shrink-0
            bg-[#0a0a0f] border-r border-white/10
            transform transition-transform duration-700 ease-out
            ${mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <Sidebar />
        </aside>

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>

        {/* Context panel — always rendered, animates between 48px (collapsed) and 320px (expanded) */}
        <aside
          className={`
            hidden lg:flex flex-shrink-0 border-l border-white/10
            transition-all duration-700 ease-out overflow-hidden
            ${contextPanelOpen ? 'w-[320px]' : 'w-12'}
          `}
        >
          {contextPanelOpen ? (
            <div className="w-[320px] overflow-y-auto">
              <ContextPanel />
            </div>
          ) : (
            <button
              onClick={toggleContextPanel}
              className="w-12 h-full flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-all duration-700"
              title="Open details panel"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </button>
          )}
        </aside>
      </div>
    </div>
  )
}
