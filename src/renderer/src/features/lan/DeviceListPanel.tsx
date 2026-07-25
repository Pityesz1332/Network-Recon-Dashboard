import { Badge } from '@renderer/components/ui/badge'
import { useLanStore } from '@renderer/stores/lan.store'
import { useScanStore } from '@renderer/stores/scan.store'
import { useViewStore } from '@renderer/stores/view.store'
import type { LanDevice } from './lan.types'

function ipSortKey(ip: string): number {
  return ip.split('.').reduce((acc, part) => acc * 256 + Number(part), 0)
}

// Clicking a device reuses the existing WAN scan engine/UI instead of a
// second results view: it sets the WAN target and flips the visible tab.
function selectDevice(device: LanDevice): void {
  useScanStore.getState().setTarget(device.ip)
  useViewStore.getState().setMode('wan')
  void useScanStore.getState().startScan()
}

export function DeviceListPanel(): React.JSX.Element {
  const devices = useLanStore((s) => s.devices)
  const isSweeping = useLanStore((s) => s.isSweeping)
  const sorted = Object.values(devices).sort((a, b) => ipSortKey(a.ip) - ipSortKey(b.ip))

  if (sorted.length === 0) {
    return (
      <div className="flex-1 px-6 py-8 text-center text-sm text-muted-foreground">
        {isSweeping
          ? 'Sweeping subnet…'
          : 'No devices found yet. Start a sweep to discover devices on your network.'}
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30 text-xs text-muted-foreground">
              <th className="px-3 py-2.5 font-medium">IP</th>
              <th className="px-3 py-2.5 font-medium">MAC</th>
              <th className="px-3 py-2.5 font-medium">Hostname</th>
              <th className="px-3 py-2.5 font-medium">Vendor</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium">RTT</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((device) => (
              <tr
                key={device.ip}
                className="cursor-pointer border-b border-border/40 transition-colors last:border-b-0 hover:bg-accent/60"
                onClick={() => selectDevice(device)}
              >
                <td className="px-3 py-2.5 font-medium">{device.ip}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{device.mac ?? '—'}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{device.hostname ?? '—'}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{device.vendor ?? '—'}</td>
                <td className="px-3 py-2.5">
                  <Badge variant={device.alive ? 'default' : 'destructive'}>
                    {device.alive ? 'Alive' : 'Unreachable'}
                  </Badge>
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {device.rttMs !== null ? `${device.rttMs} ms` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
