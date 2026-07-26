import { create } from 'zustand'
import type { ModuleUpdateEvent, ScanCompleteEvent } from '@shared/types/ipc'
import type { ReconModuleId, ReconResult } from '@shared/types/recon'
import { RECON_MODULE_IDS } from '@shared/constants'
import { targetSchema } from '@shared/utils/target.schema'
import * as reconApi from '../api/recon'

const MODULE_NAMES: Record<ReconModuleId, string> = {
  ping: 'Ping',
  dns: 'DNS Lookup',
  portscan: 'Port Scan',
  whois: 'WHOIS',
  asn: 'ASN Lookup',
  geo: 'Geolocation',
  traceroute: 'Traceroute'
}

function idleResult(moduleId: ReconModuleId): ReconResult {
  return {
    moduleId,
    moduleName: MODULE_NAMES[moduleId],
    status: 'idle',
    startedAt: null,
    finishedAt: null,
    durationMs: null,
    data: null,
    error: null
  } as ReconResult
}

interface ScanState {
  target: string
  validationError: string | null
  scanId: string | null
  isScanning: boolean
  results: Partial<Record<ReconModuleId, ReconResult>>
  totalDurationMs: number | null

  setTarget: (target: string) => void
  startScan: () => Promise<void>
  cancelScan: () => void
  applyModuleUpdate: (evt: ModuleUpdateEvent) => void
  applyScanComplete: (evt: ScanCompleteEvent) => void
}

export const useScanStore = create<ScanState>((set, get) => ({
  target: '',
  validationError: null,
  scanId: null,
  isScanning: false,
  results: {},
  totalDurationMs: null,

  setTarget: (target) => {
    const parsed = targetSchema.safeParse(target)
    set({
      target,
      validationError:
        target.length === 0
          ? null
          : parsed.success
            ? null
            : (parsed.error.issues[0]?.message ?? 'Invalid target')
    })
  },

  startScan: async () => {
    const { target, isScanning } = get()
    if (isScanning) return

    const parsed = targetSchema.safeParse(target)
    if (!parsed.success) {
      set({ validationError: parsed.error.issues[0]?.message ?? 'Invalid target' })
      return
    }

    const initialResults: Partial<Record<ReconModuleId, ReconResult>> = {}
    for (const id of RECON_MODULE_IDS) initialResults[id] = idleResult(id)

    set({ isScanning: true, results: initialResults, totalDurationMs: null, validationError: null })

    const response = await reconApi.startScan(parsed.data)
    if (!response.ok) {
      set({ isScanning: false, validationError: response.error })
      return
    }
    set({ scanId: response.scanId })
  },

  cancelScan: () => {
    const { scanId } = get()
    if (scanId) reconApi.cancelScan(scanId)
    set({ isScanning: false })
  },

  applyModuleUpdate: ({ scanId, result }) => {
    if (get().scanId !== scanId) return
    set((state) => ({ results: { ...state.results, [result.moduleId]: result } }))
  },

  applyScanComplete: ({ scanId, totalDurationMs }) => {
    if (get().scanId !== scanId) return
    set({ isScanning: false, totalDurationMs })
  }
}))
