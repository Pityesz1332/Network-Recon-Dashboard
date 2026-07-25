import type { ReconResult } from '@shared/types/recon'
import type { ReconModule, ReconModuleContext } from '../../types'
import { lookupWhois } from './whois.service'

export const WhoisModule: ReconModule = {
  id: 'whois',
  name: 'WHOIS',

  async execute(ctx: ReconModuleContext): Promise<ReconResult> {
    const startedAt = Date.now()
    const data = await lookupWhois(ctx.target, ctx.signal)
    const finishedAt = Date.now()

    return {
      moduleId: 'whois',
      moduleName: 'WHOIS',
      status: 'success',
      startedAt,
      finishedAt,
      durationMs: finishedAt - startedAt,
      data,
      error: null
    }
  }
}
