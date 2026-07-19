import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { useLanStore } from '@renderer/stores/lan.store'

export function NetworkInfoPanel(): React.JSX.Element | null {
  const network = useLanStore((s) => s.network)
  const deviceCount = useLanStore((s) => Object.keys(s.devices).length)

  if (!network) return null

  return (
    <Card className="mx-6 mt-4">
      <CardHeader>
        <CardTitle>Local Network</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <div className="text-xs text-muted-foreground">Interface</div>
          <div>{network.interfaceName}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Local IP</div>
          <div>{network.localIp}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Subnet</div>
          <div>{network.cidr}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Devices Found</div>
          <div>{deviceCount}</div>
        </div>
      </CardContent>
      {network.capped && (
        <CardContent className="pt-0 text-xs text-destructive">
          Interface subnet is larger than /24 — showing the first {network.totalHosts} addresses
          only.
        </CardContent>
      )}
    </Card>
  )
}
