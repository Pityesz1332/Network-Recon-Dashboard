import type { ReconResult } from '@shared/types/recon'
import type { ReconModule, ReconModuleContext } from '../../types'
import { lookupGeo } from './geo.service'

export const GeoModule: ReconModule = {
  id: 'geo',
  name: 'Geolocation',

  async execute(ctx: ReconModuleContext): Promise<ReconResult> {
    const startedAt = Date.now()
    const data = await lookupGeo(ctx.target, ctx.signal)
    const finishedAt = Date.now()

    return {
      moduleId: 'geo',
      moduleName: 'Geolocation',
      status: 'success',
      startedAt,
      finishedAt,
      durationMs: finishedAt - startedAt,
      data,
      error: null
    }
  }
}
