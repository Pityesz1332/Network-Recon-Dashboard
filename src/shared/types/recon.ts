export type ReconModuleId = 'ping' | 'dns' | 'portscan' | 'whois'

export type ReconStatus = 'idle' | 'running' | 'success' | 'error'

export interface ReconResultBase<TId extends ReconModuleId, TData> {
  moduleId: TId
  moduleName: string
  status: ReconStatus
  startedAt: number | null
  finishedAt: number | null
  durationMs: number | null
  data: TData | null
  error: string | null
}

export interface PingResultData {
  alive: boolean
  packetsSent: number
  packetsReceived: number
  packetLossPct: number
  minMs: number | null
  avgMs: number | null
  maxMs: number | null
  raw: string
}

export interface DNSResultData {
  addresses: { type: 'A' | 'AAAA'; address: string }[]
  cname: string[]
  hostname: string | null
}

export interface PortScanResultData {
  ports: { port: number; open: boolean }[]
  scannedCount: number
  openCount: number
}

export interface WhoisResultData {
  raw: string
  server: string
  registrar: string | null
  createdDate: string | null
  updatedDate: string | null
  expiresDate: string | null
  nameServers: string[]
}

export type PingReconResult = ReconResultBase<'ping', PingResultData>
export type DNSReconResult = ReconResultBase<'dns', DNSResultData>
export type PortScanReconResult = ReconResultBase<'portscan', PortScanResultData>
export type WhoisReconResult = ReconResultBase<'whois', WhoisResultData>

// A true discriminated union: moduleId is a distinct literal per branch, so
// narrowing on it (e.g. `if (result.moduleId === 'ping')`) also narrows `data`.
export type ReconResult = PingReconResult | DNSReconResult | PortScanReconResult | WhoisReconResult
