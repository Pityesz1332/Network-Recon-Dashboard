import type { ReconModuleId, ReconResult } from './recon'
import type { LanDevice, LanNetworkInfo } from './lan'

export const IPC = {
  ReconScanStart: 'recon:scan:start',
  ReconScanCancel: 'recon:scan:cancel',
  ReconModuleUpdate: 'recon:module:update',
  ReconScanComplete: 'recon:scan:complete',
  LanSweepStart: 'lan:sweep:start',
  LanSweepCancel: 'lan:sweep:cancel',
  LanDeviceFound: 'lan:device:found',
  LanSweepComplete: 'lan:sweep:complete'
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

export type LanSweepStartResponse =
  | { ok: true; sweepId: string; network: LanNetworkInfo; startedAt: number }
  | { ok: false; error: string }

export interface LanSweepCancelRequest {
  sweepId: string
}

export interface LanDeviceFoundEvent {
  sweepId: string
  device: LanDevice
}

export interface LanSweepCompleteEvent {
  sweepId: string
  deviceCount: number
  totalDurationMs: number
  finishedAt: number
}

export interface LanBridge {
  lan: {
    startSweep(): Promise<LanSweepStartResponse>
    cancelSweep(sweepId: string): void
    onDeviceFound(cb: (evt: LanDeviceFoundEvent) => void): () => void
    onSweepComplete(cb: (evt: LanSweepCompleteEvent) => void): () => void
  }
}

export type AppBridge = ReconBridge & LanBridge
