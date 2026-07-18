import type { ReconResult } from '@shared/types/recon'
import type { ReconModule, ReconModuleContext } from '../../types'
import { ConfigService } from '../../../services/ConfigService'
import { NodeSocketProvider } from '../../providers/portscan/NodeSocketProvider'
import type { PortScanProvider } from '../../providers/portscan/PortScanProvider'

// Wraps a PortScanProvider as a ReconModule so the engine only ever deals in
// modules, not providers directly. Swap the provider (e.g. a future NmapProvider)
// without the engine or UI knowing.
export class PortScanModule implements ReconModule {
  readonly id = 'portscan' as const
  readonly name = 'Port Scan'

  constructor(private readonly provider: PortScanProvider = new NodeSocketProvider()) {}

  async execute(ctx: ReconModuleContext): Promise<ReconResult> {
    const startedAt = Date.now()
    const ports = ConfigService.getScanPorts()
    const results = await this.provider.scan(ctx.target, ports, ctx.signal)
    const finishedAt = Date.now()

    return {
      moduleId: 'portscan',
      moduleName: this.name,
      status: 'success',
      startedAt,
      finishedAt,
      durationMs: finishedAt - startedAt,
      data: {
        ports: results,
        scannedCount: results.length,
        openCount: results.filter((r) => r.open).length
      },
      error: null
    }
  }
}
