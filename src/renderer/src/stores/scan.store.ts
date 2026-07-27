import { create } from 'zustand'
import type { ModuleUpdateEvent, ScanCompleteEvent } from '@shared/types/ipc'
import type { ReconModuleId, ReconResult } from '@shared/types/recon'
import { RECON_MODULE_IDS } from '@shared/constants'
import { targetSchema } from '@shared/utils/target.schema'
import * as reconApi from '../api/recon'
import * as reportApi from '../api/report'

const MODULE_NAMES: Record<ReconModuleId, string> = {
  ping: 'Ping',
  dns: 'DNS Lookup',
  portscan: 'Port Scan',
  whois: 'WHOIS',
  asn: 'ASN Lookup',
  geo: 'Geolocation',
  traceroute: 'Traceroute',
  rdns: 'Reverse DNS',
  http: 'HTTP Headers'
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
  startedAt: number | null
  finishedAt: number | null
  totalDurationMs: number | null
  isExporting: boolean
  exportError: string | null
  exportedPath: string | null

  setTarget: (target: string) => void
  startScan: () => Promise<void>
  cancelScan: () => void
  applyModuleUpdate: (evt: ModuleUpdateEvent) => void
  applyScanComplete: (evt: ScanCompleteEvent) => void
  exportPdf: () => Promise<void>
}

export const useScanStore = create<ScanState>((set, get) => ({
  target: '',
  validationError: null,
  scanId: null,
  isScanning: false,
  results: {},
  startedAt: null,
  finishedAt: null,
  totalDurationMs: null,
  isExporting: false,
  exportError: null,
  exportedPath: null,

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

    set({
      isScanning: true,
      results: initialResults,
      startedAt: null,
      finishedAt: null,
      totalDurationMs: null,
      validationError: null,
      exportError: null,
      exportedPath: null
    })

    const response = await reconApi.startScan(parsed.data)
    if (!response.ok) {
      set({ isScanning: false, validationError: response.error })
      return
    }
    set({ scanId: response.scanId, startedAt: response.startedAt })
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

  applyScanComplete: ({ scanId, totalDurationMs, finishedAt }) => {
    if (get().scanId !== scanId) return
    set({ isScanning: false, totalDurationMs, finishedAt })
  },

  exportPdf: async () => {
    const state = get()
    if (state.isExporting || state.isScanning) return

    // Export in dashboard order, skipping modules that never produced a result.
    const results = RECON_MODULE_IDS.map((id) => state.results[id]).filter(
      (result): result is ReconResult => result !== undefined
    )
    if (results.length === 0) return

    set({ isExporting: true, exportError: null, exportedPath: null })
    try {
      const response = await reportApi.exportPdf({
        target: state.target,
        startedAt: state.startedAt ?? Date.now(),
        finishedAt: state.finishedAt,
        totalDurationMs: state.totalDurationMs,
        results
      })
      if (response.ok) {
        set({ exportedPath: response.filePath })
      } else if (!response.canceled) {
        set({ exportError: response.error })
      }
    } catch {
      set({ exportError: 'Could not export the report' })
    } finally {
      set({ isExporting: false })
    }
  }
}))
