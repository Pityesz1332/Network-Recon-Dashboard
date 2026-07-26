import type { ReconResult } from '@shared/types/recon'
import type { ReconModule, ReconModuleContext } from '../../types'
import { lookupRdns } from './rdns.service'

export const RdnsModule: ReconModule = {
  id: 'rdns',
  name: 'Reverse DNS',

  async execute(ctx: ReconModuleContext): Promise<ReconResult> {
    const startedAt = Date.now()
    const data = await lookupRdns(ctx.target, ctx.signal)
    const finishedAt = Date.now()

    return {
      moduleId: 'rdns',
      moduleName: 'Reverse DNS',
      status: 'success',
      startedAt,
      finishedAt,
      durationMs: finishedAt - startedAt,
      data,
      error: null
    }
  }
}
