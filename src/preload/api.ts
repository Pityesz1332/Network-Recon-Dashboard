import { ipcRenderer, type IpcRendererEvent } from 'electron'
import {
  IPC,
  type AppBridge,
  type LanDeviceFoundEvent,
  type LanSweepCompleteEvent,
  type LanSweepStartResponse,
  type ModuleUpdateEvent,
  type ScanCompleteEvent,
  type ScanStartResponse
} from '@shared/types/ipc'

export const api: AppBridge = {
  recon: {
    startScan(target: string): Promise<ScanStartResponse> {
      return ipcRenderer.invoke(IPC.ReconScanStart, target)
    },

    cancelScan(scanId: string): void {
      ipcRenderer.send(IPC.ReconScanCancel, { scanId })
    },

    onModuleUpdate(cb: (evt: ModuleUpdateEvent) => void): () => void {
      const listener = (_event: IpcRendererEvent, payload: ModuleUpdateEvent): void => cb(payload)
      ipcRenderer.on(IPC.ReconModuleUpdate, listener)
      return () => ipcRenderer.removeListener(IPC.ReconModuleUpdate, listener)
    },

    onScanComplete(cb: (evt: ScanCompleteEvent) => void): () => void {
      const listener = (_event: IpcRendererEvent, payload: ScanCompleteEvent): void => cb(payload)
      ipcRenderer.on(IPC.ReconScanComplete, listener)
      return () => ipcRenderer.removeListener(IPC.ReconScanComplete, listener)
    }
  },

  lan: {
    startSweep(): Promise<LanSweepStartResponse> {
      return ipcRenderer.invoke(IPC.LanSweepStart)
    },

    cancelSweep(sweepId: string): void {
      ipcRenderer.send(IPC.LanSweepCancel, { sweepId })
    },

    onDeviceFound(cb: (evt: LanDeviceFoundEvent) => void): () => void {
      const listener = (_event: IpcRendererEvent, payload: LanDeviceFoundEvent): void => cb(payload)
      ipcRenderer.on(IPC.LanDeviceFound, listener)
      return () => ipcRenderer.removeListener(IPC.LanDeviceFound, listener)
    },

    onSweepComplete(cb: (evt: LanSweepCompleteEvent) => void): () => void {
      const listener = (_event: IpcRendererEvent, payload: LanSweepCompleteEvent): void =>
        cb(payload)
      ipcRenderer.on(IPC.LanSweepComplete, listener)
      return () => ipcRenderer.removeListener(IPC.LanSweepComplete, listener)
    }
  }
}
