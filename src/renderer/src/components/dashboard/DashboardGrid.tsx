import { RECON_MODULE_IDS } from '@shared/constants'
import { useScanStore } from '@renderer/stores/scan.store'
import { ReconCard } from './ReconCard'

export function DashboardGrid(): React.JSX.Element {
  const results = useScanStore((s) => s.results)

  return (
    <div className="grid flex-1 auto-rows-min grid-cols-1 items-start gap-3 overflow-y-auto p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {RECON_MODULE_IDS.map((id) => (
        <ReconCard key={id} moduleId={id} result={results[id] ?? null} />
      ))}
    </div>
  )
}
