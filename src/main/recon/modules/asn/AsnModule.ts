import type { ReconResult } from '@shared/types/recon'
import type { ReconModule, ReconModuleContext } from '../../types'
import { lookupAsn } from './asn.service'

export const AsnModule: ReconModule = {
  id: 'asn',
  name: 'ASN Lookup',

  async execute(ctx: ReconModuleContext): Promise<ReconResult> {
    const startedAt = Date.now()
    const data = await lookupAsn(ctx.target, ctx.signal)
    const finishedAt = Date.now()

    return {
      moduleId: 'asn',
      moduleName: 'ASN Lookup',
      status: 'success',
      startedAt,
      finishedAt,
      durationMs: finishedAt - startedAt,
      data,
      error: null
    }
  }
}
