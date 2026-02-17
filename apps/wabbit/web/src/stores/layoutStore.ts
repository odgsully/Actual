import { create } from 'zustand'
import type { OutputType } from '@/types/app'

interface LayoutState {
  contextPanelOpen: boolean
  mobileDrawerOpen: boolean
  settingsOpen: boolean
  addRecordsOpen: boolean

  // Wabb context — set by WabbPage, read by TopBar
  wabbTitle: string | null
  recordCounter: string | null
  activeWabbId: string | null
  activeOutputType: OutputType | null
  activeCurrentWindow: number
  canAddRecords: boolean

  toggleContextPanel: () => void
  toggleMobileDrawer: () => void
  toggleSettings: () => void
  toggleAddRecords: () => void
  setWabbContext: (ctx: {
    title: string
    counter: string
    wabbId: string
    outputType: OutputType
    currentWindow: number
    canAddRecords: boolean
  }) => void
  clearWabbContext: () => void
}

export const useLayoutStore = create<LayoutState>((set) => ({
  contextPanelOpen: false,
  mobileDrawerOpen: false,
  settingsOpen: false,
  addRecordsOpen: false,

  wabbTitle: null,
  recordCounter: null,
  activeWabbId: null,
  activeOutputType: null,
  activeCurrentWindow: 1,
  canAddRecords: false,

  toggleContextPanel: () => set((s) => ({ contextPanelOpen: !s.contextPanelOpen })),
  toggleMobileDrawer: () => set((s) => ({ mobileDrawerOpen: !s.mobileDrawerOpen })),
  toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
  toggleAddRecords: () => set((s) => ({ addRecordsOpen: !s.addRecordsOpen })),

  setWabbContext: (ctx) =>
    set({
      wabbTitle: ctx.title,
      recordCounter: ctx.counter,
      activeWabbId: ctx.wabbId,
      activeOutputType: ctx.outputType,
      activeCurrentWindow: ctx.currentWindow,
      canAddRecords: ctx.canAddRecords,
    }),

  clearWabbContext: () =>
    set({
      wabbTitle: null,
      recordCounter: null,
      activeWabbId: null,
      activeOutputType: null,
      activeCurrentWindow: 1,
      canAddRecords: false,
      settingsOpen: false,
      addRecordsOpen: false,
    }),
}))
