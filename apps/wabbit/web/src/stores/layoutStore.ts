import { create } from 'zustand'

interface LayoutState {
  contextPanelOpen: boolean
  mobileDrawerOpen: boolean
  settingsOpen: boolean

  // Wabb context — set by WabbPage, read by TopBar
  wabbTitle: string | null
  recordCounter: string | null
  activeWabbId: string | null

  toggleContextPanel: () => void
  toggleMobileDrawer: () => void
  toggleSettings: () => void
  setWabbContext: (title: string, counter: string, wabbId: string) => void
  clearWabbContext: () => void
}

export const useLayoutStore = create<LayoutState>((set) => ({
  contextPanelOpen: false,
  mobileDrawerOpen: false,
  settingsOpen: false,

  wabbTitle: null,
  recordCounter: null,
  activeWabbId: null,

  toggleContextPanel: () => set((s) => ({ contextPanelOpen: !s.contextPanelOpen })),
  toggleMobileDrawer: () => set((s) => ({ mobileDrawerOpen: !s.mobileDrawerOpen })),
  toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),

  setWabbContext: (title, counter, wabbId) =>
    set({ wabbTitle: title, recordCounter: counter, activeWabbId: wabbId }),

  clearWabbContext: () =>
    set({ wabbTitle: null, recordCounter: null, activeWabbId: null, settingsOpen: false }),
}))
