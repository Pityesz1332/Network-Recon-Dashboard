import { useEffect } from 'react'
import { onModuleUpdate, onScanComplete } from '@renderer/api/recon'
import { onDeviceFound, onSweepComplete } from '@renderer/api/lan'
import { TopBar } from '@renderer/components/common/TopBar'
import { DashboardGrid } from '@renderer/components/dashboard/DashboardGrid'
import { ScanPanel } from '@renderer/features/scan/ScanPanel'
import { LanView } from '@renderer/features/lan/LanView'
import { useScanStore } from '@renderer/stores/scan.store'
import { useLanStore } from '@renderer/stores/lan.store'
import { useViewStore } from '@renderer/stores/view.store'

function App(): React.JSX.Element {
  const mode = useViewStore((s) => s.mode)

  useEffect(() => {
    const unsubscribeUpdate = onModuleUpdate((evt) =>
      useScanStore.getState().applyModuleUpdate(evt)
    )
    const unsubscribeComplete = onScanComplete((evt) =>
      useScanStore.getState().applyScanComplete(evt)
    )
    const unsubscribeDeviceFound = onDeviceFound((evt) =>
      useLanStore.getState().applyDeviceFound(evt)
    )
    const unsubscribeSweepComplete = onSweepComplete((evt) =>
      useLanStore.getState().applySweepComplete(evt)
    )
    return () => {
      unsubscribeUpdate()
      unsubscribeComplete()
      unsubscribeDeviceFound()
      unsubscribeSweepComplete()
    }
  }, [])

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <TopBar />
      {mode === 'wan' ? (
        <>
          <ScanPanel />
          <DashboardGrid />
        </>
      ) : (
        <LanView />
      )}
    </div>
  )
}

export default App
