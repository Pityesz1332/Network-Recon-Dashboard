import { ElectronAPI } from '@electron-toolkit/preload'
import type { AppBridge } from '@shared/types/ipc'

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppBridge
  }
}
