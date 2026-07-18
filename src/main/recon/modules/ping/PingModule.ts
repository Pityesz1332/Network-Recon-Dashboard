import type { ReconResult } from '@shared/types/recon'
import type { ReconModule, ReconModuleContext } from '../../types'
import { pingHost } from './ping.service'

export const PingModule: ReconModule = {
  id: 'ping',
  name: 'Ping',

  async execute(ctx: ReconModuleContext): Promise<ReconResult> {
    const startedAt = Date.now()
    const data = await pingHost(ctx.target, ctx.signal)
    const finishedAt = Date.now()

    return {
      moduleId: 'ping',
      moduleName: 'Ping',
      status: 'success',
      startedAt,
      finishedAt,
      durationMs: finishedAt - startedAt,
      data,
      error: null
    }
  }
}
