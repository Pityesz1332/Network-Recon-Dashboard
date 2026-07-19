import type {
  LanDeviceFoundEvent,
  LanSweepCompleteEvent,
  LanSweepStartResponse
} from '@shared/types/ipc'

export function startSweep(): Promise<LanSweepStartResponse> {
  return window.api.lan.startSweep()
}

export function cancelSweep(sweepId: string): void {
  window.api.lan.cancelSweep(sweepId)
}

export function onDeviceFound(cb: (evt: LanDeviceFoundEvent) => void): () => void {
  return window.api.lan.onDeviceFound(cb)
}

export function onSweepComplete(cb: (evt: LanSweepCompleteEvent) => void): () => void {
  return window.api.lan.onSweepComplete(cb)
}
