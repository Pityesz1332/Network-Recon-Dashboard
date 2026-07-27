import { registerReconIpc } from './recon.ipc'
import { registerSystemIpc } from './system.ipc'
import { registerLanIpc } from './lan.ipc'
import { registerReportIpc } from './report.ipc'

export function registerIpcHandlers(): void {
  registerReconIpc()
  registerSystemIpc()
  registerLanIpc()
  registerReportIpc()
}
