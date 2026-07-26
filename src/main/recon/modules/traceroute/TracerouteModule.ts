import type { ReconResult } from '@shared/types/recon'
import type { ReconModule, ReconModuleContext } from '../../types'
import { traceHost } from './traceroute.service'

export const TracerouteModule: ReconModule = {
  id: 'traceroute',
  name: 'Traceroute',

  async execute(ctx: ReconModuleContext): Promise<ReconResult> {
    const startedAt = Date.now()
    const data = await traceHost(ctx.target, ctx.signal)
    const finishedAt = Date.now()

    return {
      moduleId: 'traceroute',
      moduleName: 'Traceroute',
      status: 'success',
      startedAt,
      finishedAt,
      durationMs: finishedAt - startedAt,
      data,
      error: null
    }
  }
}
