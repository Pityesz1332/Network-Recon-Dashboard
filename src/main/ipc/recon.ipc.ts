import { randomUUID } from 'node:crypto'
import { ipcMain, type IpcMainEvent, type IpcMainInvokeEvent } from 'electron'
import { IPC, type ScanCancelRequest, type ScanStartResponse } from '@shared/types/ipc'
import { targetSchema } from '@shared/utils/target.schema'
import { ModuleRegistry } from '../recon/engine/ModuleRegistry'
import { ReconEngine } from '../recon/engine/ReconEngine'
import { PingModule } from '../recon/modules/ping/PingModule'
import { DNSModule } from '../recon/modules/dns/DNSModule'
import { PortScanModule } from '../recon/modules/portscan/PortScanModule'
import { WhoisModule } from '../recon/modules/whois/WhoisModule'
import { AsnModule } from '../recon/modules/asn/AsnModule'
import { GeoModule } from '../recon/modules/geo/GeoModule'
import { TracerouteModule } from '../recon/modules/traceroute/TracerouteModule'
import { RdnsModule } from '../recon/modules/rdns/RdnsModule'
import { logger } from '../utils/logger'

const registry = new ModuleRegistry()
registry.register(PingModule)
registry.register(DNSModule)
registry.register(new PortScanModule())
registry.register(WhoisModule)
registry.register(AsnModule)
registry.register(GeoModule)
registry.register(TracerouteModule)
registry.register(RdnsModule)

const engine = new ReconEngine(registry)

// Only one scan runs at a time.
let activeScanId: string | null = null
let activeController: AbortController | null = null

export function registerReconIpc(): void {
  ipcMain.handle(
    IPC.ReconScanStart,
    async (event: IpcMainInvokeEvent, target: string): Promise<ScanStartResponse> => {
      // Re-validate on the main process side — the renderer is untrusted input here.
      const parsed = targetSchema.safeParse(target)
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid target' }
      }

      activeController?.abort()

      const scanId = randomUUID()
      const controller = new AbortController()
      activeScanId = scanId
      activeController = controller

      const moduleIds = registry.getAll().map((mod) => mod.id)
      const startedAt = Date.now()

      engine
        .runScan(parsed.data, controller.signal, (result) => {
          if (activeScanId !== scanId || event.sender.isDestroyed()) return
          event.sender.send(IPC.ReconModuleUpdate, { scanId, result })
        })
        .then((totalDurationMs) => {
          if (activeScanId !== scanId || event.sender.isDestroyed()) return
          event.sender.send(IPC.ReconScanComplete, {
            scanId,
            totalDurationMs,
            finishedAt: Date.now()
          })
        })
        .catch((err) => {
          logger.error('recon.ipc', 'scan failed unexpectedly', err)
        })

      return { ok: true, scanId, moduleIds, startedAt }
    }
  )

  ipcMain.on(IPC.ReconScanCancel, (_event: IpcMainEvent, payload: ScanCancelRequest) => {
    if (activeScanId === payload.scanId) {
      activeController?.abort()
    }
  })
}
