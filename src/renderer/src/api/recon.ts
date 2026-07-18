import type { ModuleUpdateEvent, ScanCompleteEvent, ScanStartResponse } from '@shared/types/ipc'

export function startScan(target: string): Promise<ScanStartResponse> {
  return window.api.recon.startScan(target)
}

export function cancelScan(scanId: string): void {
  window.api.recon.cancelScan(scanId)
}

export function onModuleUpdate(cb: (evt: ModuleUpdateEvent) => void): () => void {
  return window.api.recon.onModuleUpdate(cb)
}

export function onScanComplete(cb: (evt: ScanCompleteEvent) => void): () => void {
  return window.api.recon.onScanComplete(cb)
}
