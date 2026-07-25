import {
  CheckCircle2,
  FileSearch,
  Globe,
  Loader2,
  Radar,
  Wifi,
  XCircle,
  type LucideIcon
} from 'lucide-react'
import { Badge } from '@renderer/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import type { ReconModuleId, ReconResult, ReconStatus } from '@renderer/features/scan/scan.types'

const MODULE_ICONS: Record<ReconModuleId, LucideIcon> = {
  ping: Wifi,
  dns: Globe,
  portscan: Radar,
  whois: FileSearch
}

const MODULE_TITLES: Record<ReconModuleId, string> = {
  ping: 'Ping',
  dns: 'DNS Lookup',
  portscan: 'Port Scan',
  whois: 'WHOIS'
}

function StatusBadge({ status }: { status: ReconStatus }): React.JSX.Element {
  switch (status) {
    case 'running':
      return (
        <Badge variant="outline" className="gap-1">
          <Loader2 className="size-3 animate-spin" /> Running
        </Badge>
      )
    case 'success':
      return (
        <Badge className="gap-1 bg-success text-success-foreground">
          <CheckCircle2 className="size-3" /> Done
        </Badge>
      )
    case 'error':
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="size-3" /> Error
        </Badge>
      )
    default:
      return <Badge variant="secondary">Idle</Badge>
  }
}

function ResultBody({ result }: { result: ReconResult }): React.JSX.Element {
  if (result.status === 'error') {
    return <p className="text-xs text-destructive">{result.error}</p>
  }

  if (result.status !== 'success' || !result.data) {
    return <p className="text-xs text-muted-foreground">Waiting to run…</p>
  }

  if (result.moduleId === 'ping') {
    const d = result.data
    return (
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <dt className="text-muted-foreground">Status</dt>
        <dd>{d.alive ? 'Alive' : 'Unreachable'}</dd>
        <dt className="text-muted-foreground">Packet loss</dt>
        <dd>{d.packetLossPct}%</dd>
        <dt className="text-muted-foreground">Avg RTT</dt>
        <dd>{d.avgMs !== null ? `${d.avgMs} ms` : '—'}</dd>
      </dl>
    )
  }

  if (result.moduleId === 'dns') {
    const d = result.data
    return (
      <div className="space-y-1 text-xs">
        {d.hostname && (
          <p>
            <span className="text-muted-foreground">PTR: </span>
            {d.hostname}
          </p>
        )}
        {d.addresses.length === 0 ? (
          <p className="text-muted-foreground">No records found</p>
        ) : (
          <ul className="space-y-0.5">
            {d.addresses.map((a) => (
              <li key={`${a.type}-${a.address}`}>
                <span className="text-muted-foreground">{a.type}: </span>
                {a.address}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  if (result.moduleId === 'portscan') {
    const d = result.data
    return (
      <div className="text-xs">
        <p className="text-muted-foreground">
          {d.openCount} open / {d.scannedCount} scanned
        </p>
        <ul className="mt-1.5 flex flex-wrap gap-1">
          {d.ports
            .filter((p) => p.open)
            .map((p) => (
              <Badge key={p.port} variant="outline">
                {p.port}
              </Badge>
            ))}
        </ul>
      </div>
    )
  }

  const d = result.data
  const hasFields = d.registrar || d.createdDate || d.expiresDate || d.nameServers.length > 0
  return (
    <div className="space-y-1 text-xs">
      {d.registrar && (
        <p>
          <span className="text-muted-foreground">Registrar: </span>
          {d.registrar}
        </p>
      )}
      {d.createdDate && (
        <p>
          <span className="text-muted-foreground">Created: </span>
          {d.createdDate}
        </p>
      )}
      {d.expiresDate && (
        <p>
          <span className="text-muted-foreground">Expires: </span>
          {d.expiresDate}
        </p>
      )}
      {d.nameServers.length > 0 && (
        <div>
          <span className="text-muted-foreground">Name servers:</span>
          <ul className="mt-0.5 space-y-0.5">
            {d.nameServers.map((ns) => (
              <li key={ns}>{ns}</li>
            ))}
          </ul>
        </div>
      )}
      {!hasFields && (
        <p className="text-muted-foreground">No structured data — server: {d.server}</p>
      )}
    </div>
  )
}

interface ReconCardProps {
  moduleId: ReconModuleId
  result: ReconResult | null
}

export function ReconCard({ moduleId, result }: ReconCardProps): React.JSX.Element {
  const Icon = MODULE_ICONS[moduleId]

  return (
    <Card className="gap-2.5 py-3.5">
      <CardHeader className="flex-row items-center justify-between gap-2 px-3.5">
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Icon className="size-3.5" />
          </span>
          {MODULE_TITLES[moduleId]}
        </CardTitle>
        {result && <StatusBadge status={result.status} />}
      </CardHeader>
      <CardContent className="px-3.5">
        {result?.durationMs !== null && result?.durationMs !== undefined && (
          <p className="mb-2 text-[11px] text-muted-foreground">{result.durationMs} ms</p>
        )}
        {result ? (
          <ResultBody result={result} />
        ) : (
          <p className="text-xs text-muted-foreground">Idle</p>
        )}
      </CardContent>
    </Card>
  )
}
