import type { ReconModuleId, ReconResult } from '@shared/types/recon'

export interface ReconModuleContext {
  target: string
  signal: AbortSignal
}

export interface ReconModule {
  id: ReconModuleId
  name: string
  execute(ctx: ReconModuleContext): Promise<ReconResult>
}
