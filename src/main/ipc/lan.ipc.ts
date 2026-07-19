import { randomUUID } from 'node:crypto'
import { ipcMain, type IpcMainEvent, type IpcMainInvokeEvent } from 'electron'
import { IPC, type LanSweepCancelRequest, type LanSweepStartResponse } from '@shared/types/ipc'
import { detectLocalNetwork } from '../services/NetworkInfoService'
import { sweepSubnet } from '../lan/sweep.service'
import { logger } from '../utils/logger'

let activeSweepId: string | null = null
let activeController: AbortController | null = null

export function registerLanIpc(): void {
  ipcMain.handle(
    IPC.LanSweepStart,
    async (event: IpcMainInvokeEvent): Promise<LanSweepStartResponse> => {
      const detected = detectLocalNetwork()
      if (!detected) {
        return { ok: false, error: 'No local network interface found' }
      }

      activeController?.abort()

      const sweepId = randomUUID()
      const controller = new AbortController()
      activeSweepId = sweepId
      activeController = controller

      const startedAt = Date.now()

      sweepSubnet(detected.hostIps, controller.signal, (device) => {
        if (activeSweepId !== sweepId || event.sender.isDestroyed()) return
        event.sender.send(IPC.LanDeviceFound, { sweepId, device })
      })
        .then((deviceCount) => {
          if (activeSweepId !== sweepId || event.sender.isDestroyed()) return
          event.sender.send(IPC.LanSweepComplete, {
            sweepId,
            deviceCount,
            totalDurationMs: Date.now() - startedAt,
            finishedAt: Date.now()
          })
        })
        .catch((err) => {
          logger.error('lan.ipc', 'sweep failed unexpectedly', err)
        })

      return { ok: true, sweepId, network: detected.network, startedAt }
    }
  )

  ipcMain.on(IPC.LanSweepCancel, (_event: IpcMainEvent, payload: LanSweepCancelRequest) => {
    if (activeSweepId === payload.sweepId) {
      activeController?.abort()
    }
  })
}
