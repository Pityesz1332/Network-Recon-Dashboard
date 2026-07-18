import { ipcRenderer, type IpcRendererEvent } from 'electron'
import {
  IPC,
  type ModuleUpdateEvent,
  type ReconBridge,
  type ScanCompleteEvent,
  type ScanStartResponse
} from '@shared/types/ipc'

export const api: ReconBridge = {
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
  }
}
