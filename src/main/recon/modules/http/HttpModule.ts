import type { ReconResult } from '@shared/types/recon'
import type { ReconModule, ReconModuleContext } from '../../types'
import { lookupHttpHeaders } from './http.service'

export const HttpModule: ReconModule = {
  id: 'http',
  name: 'HTTP Headers',

  async execute(ctx: ReconModuleContext): Promise<ReconResult> {
    const startedAt = Date.now()
    const data = await lookupHttpHeaders(ctx.target, ctx.signal)
    const finishedAt = Date.now()

    return {
      moduleId: 'http',
      moduleName: 'HTTP Headers',
      status: 'success',
      startedAt,
      finishedAt,
      durationMs: finishedAt - startedAt,
      data,
      error: null
    }
  }
}
