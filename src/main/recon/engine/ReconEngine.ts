import type { ReconResult } from '@shared/types/recon'
import type { ModuleRegistry } from './ModuleRegistry'
import type { ReconModule } from '../types'
import { logger } from '../../utils/logger'

// the engine is generic over all registered modules
function runningPlaceholder(mod: ReconModule): ReconResult {
  return {
    moduleId: mod.id,
    moduleName: mod.name,
    status: 'running',
    startedAt: Date.now(),
    finishedAt: null,
    durationMs: null,
    data: null,
    error: null
  } as ReconResult
}

function errorResult(mod: ReconModule, err: unknown): ReconResult {
  const finishedAt = Date.now()
  return {
    moduleId: mod.id,
    moduleName: mod.name,
    status: 'error',
    startedAt: null,
    finishedAt,
    durationMs: null,
    data: null,
    error: err instanceof Error ? err.message : String(err)
  } as ReconResult
}

export class ReconEngine {
  constructor(private readonly registry: ModuleRegistry) {}

  async runScan(
    target: string,
    signal: AbortSignal,
    onUpdate: (result: ReconResult) => void
  ): Promise<number> {
    const started = Date.now()

    const runs = this.registry.getAll().map(async (mod) => {
      onUpdate(runningPlaceholder(mod))
      try {
        const result = await mod.execute({ target, signal })
        onUpdate(result)
      } catch (err) {
        logger.error('ReconEngine', `module "${mod.id}" failed`, err)
        onUpdate(errorResult(mod, err))
      }
    })

    await Promise.allSettled(runs)
    return Date.now() - started
  }
}
