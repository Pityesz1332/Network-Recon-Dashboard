import { RECON_MODULE_IDS } from '@shared/constants'
import { useScanStore } from '@renderer/stores/scan.store'
import { ReconCard } from './ReconCard'

export function DashboardGrid(): React.JSX.Element {
  const results = useScanStore((s) => s.results)

  return (
    <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-6 sm:grid-cols-2 xl:grid-cols-3">
      {RECON_MODULE_IDS.map((id) => (
        <ReconCard key={id} moduleId={id} result={results[id] ?? null} />
      ))}
    </div>
  )
}
