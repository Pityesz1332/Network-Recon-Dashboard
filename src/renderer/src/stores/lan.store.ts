import { create } from 'zustand'
import type { LanDeviceFoundEvent, LanSweepCompleteEvent } from '@shared/types/ipc'
import type { LanDevice, LanNetworkInfo } from '@shared/types/lan'
import * as lanApi from '../api/lan'

interface LanState {
  sweepId: string | null
  isSweeping: boolean
  network: LanNetworkInfo | null
  devices: Record<string, LanDevice>
  totalDurationMs: number | null
  error: string | null

  startSweep: () => Promise<void>
  cancelSweep: () => void
  applyDeviceFound: (evt: LanDeviceFoundEvent) => void
  applySweepComplete: (evt: LanSweepCompleteEvent) => void
}

export const useLanStore = create<LanState>((set, get) => ({
  sweepId: null,
  isSweeping: false,
  network: null,
  devices: {},
  totalDurationMs: null,
  error: null,

  startSweep: async () => {
    if (get().isSweeping) return

    set({ isSweeping: true, devices: {}, totalDurationMs: null, error: null })

    const response = await lanApi.startSweep()
    if (!response.ok) {
      set({ isSweeping: false, error: response.error })
      return
    }
    set({ sweepId: response.sweepId, network: response.network })
  },

  cancelSweep: () => {
    const { sweepId } = get()
    if (sweepId) lanApi.cancelSweep(sweepId)
    set({ isSweeping: false })
  },

  applyDeviceFound: ({ sweepId, device }) => {
    if (get().sweepId !== sweepId) return
    set((state) => ({ devices: { ...state.devices, [device.ip]: device } }))
  },

  applySweepComplete: ({ sweepId, totalDurationMs }) => {
    if (get().sweepId !== sweepId) return
    set({ isSweeping: false, totalDurationMs })
  }
}))
