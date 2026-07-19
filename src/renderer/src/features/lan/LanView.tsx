import { LanSweepPanel } from './LanSweepPanel'
import { NetworkInfoPanel } from './NetworkInfoPanel'
import { DeviceListPanel } from './DeviceListPanel'

export function LanView(): React.JSX.Element {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <LanSweepPanel />
      <NetworkInfoPanel />
      <DeviceListPanel />
    </div>
  )
}
