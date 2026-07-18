import type { ReconModuleId, ReconResult } from './recon'

export const IPC = {
  ReconScanStart: 'recon:scan:start',
  ReconScanCancel: 'recon:scan:cancel',
  ReconModuleUpdate: 'recon:module:update',
  ReconScanComplete: 'recon:scan:complete'
} as const

export interface ScanStartRequest {
  target: string
}

export type ScanStartResponse =
  | { ok: true; scanId: string; moduleIds: ReconModuleId[]; startedAt: number }
  | { ok: false; error: string }

export interface ScanCancelRequest {
  scanId: string
}

export interface ModuleUpdateEvent {
  scanId: string
  result: ReconResult
}

export interface ScanCompleteEvent {
  scanId: string
  totalDurationMs: number
  finishedAt: number
}

export interface ReconBridge {
  recon: {
    startScan(target: string): Promise<ScanStartResponse>
    cancelScan(scanId: string): void
    onModuleUpdate(cb: (evt: ModuleUpdateEvent) => void): () => void
    onScanComplete(cb: (evt: ScanCompleteEvent) => void): () => void
  }
}
