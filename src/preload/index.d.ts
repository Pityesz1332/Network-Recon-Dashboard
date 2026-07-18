import { ElectronAPI } from '@electron-toolkit/preload'
import type { ReconBridge } from '@shared/types/ipc'

declare global {
  interface Window {
    electron: ElectronAPI
    api: ReconBridge
  }
}
