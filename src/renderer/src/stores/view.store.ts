import { create } from 'zustand'

export type ViewMode = 'lan' | 'wan'

interface ViewState {
  mode: ViewMode
  setMode: (mode: ViewMode) => void
}

export const useViewStore = create<ViewState>((set) => ({
  mode: 'wan',
  setMode: (mode) => set({ mode })
}))
