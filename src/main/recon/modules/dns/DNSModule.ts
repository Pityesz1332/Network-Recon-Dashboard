import type { ReconResult } from '@shared/types/recon'
import type { ReconModule, ReconModuleContext } from '../../types'
import { lookupHost } from './dns.service'

export const DNSModule: ReconModule = {
  id: 'dns',
  name: 'DNS Lookup',

  async execute(ctx: ReconModuleContext): Promise<ReconResult> {
    const startedAt = Date.now()
    const data = await lookupHost(ctx.target, ctx.signal)
    const finishedAt = Date.now()

    return {
      moduleId: 'dns',
      moduleName: 'DNS Lookup',
      status: 'success',
      startedAt,
      finishedAt,
      durationMs: finishedAt - startedAt,
      data,
      error: null
    }
  }
}
