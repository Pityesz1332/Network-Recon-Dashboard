import type { ReconModuleId } from '@shared/types/recon'
import type { ReconModule } from '../types'

export class ModuleRegistry {
  private readonly modules = new Map<ReconModuleId, ReconModule>()

  register(module: ReconModule): void {
    this.modules.set(module.id, module)
  }

  getAll(): ReconModule[] {
    return Array.from(this.modules.values())
  }
}
