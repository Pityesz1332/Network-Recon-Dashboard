import { useEffect } from 'react'
import { onModuleUpdate, onScanComplete } from '@renderer/api/recon'
import { TopBar } from '@renderer/components/common/TopBar'
import { DashboardGrid } from '@renderer/components/dashboard/DashboardGrid'
import { ScanPanel } from '@renderer/features/scan/ScanPanel'
import { useScanStore } from '@renderer/stores/scan.store'

function App(): React.JSX.Element {
  useEffect(() => {
    const unsubscribeUpdate = onModuleUpdate((evt) =>
      useScanStore.getState().applyModuleUpdate(evt)
    )
    const unsubscribeComplete = onScanComplete((evt) =>
      useScanStore.getState().applyScanComplete(evt)
    )
    return () => {
      unsubscribeUpdate()
      unsubscribeComplete()
    }
  }, [])

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <TopBar />
      <ScanPanel />
      <DashboardGrid />
    </div>
  )
}

export default App
