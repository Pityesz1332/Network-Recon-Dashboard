import { registerReconIpc } from './recon.ipc'
import { registerSystemIpc } from './system.ipc'

export function registerIpcHandlers(): void {
  registerReconIpc()
  registerSystemIpc()
}
