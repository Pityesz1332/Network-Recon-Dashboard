export type ReconModuleId =
  | 'ping'
  | 'dns'
  | 'portscan'
  | 'whois'
  | 'asn'
  | 'geo'
  | 'traceroute'
  | 'rdns'
  | 'http'

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

export interface AsnResultData {
  queriedIp: string
  asn: number | null
  asName: string | null
  bgpPrefix: string | null
  countryCode: string | null
  registry: string | null
  allocatedDate: string | null
  raw: string
}

export interface GeoResultData {
  queriedIp: string
  country: string | null
  countryCode: string | null
  region: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  timezone: string | null
  isp: string | null
}

export interface TracerouteHopData {
  hop: number
  ip: string | null
  avgMs: number | null
  timedOut: boolean
}

export interface TracerouteResultData {
  hops: TracerouteHopData[]
  reachedTarget: boolean
  raw: string
}

export interface RdnsEntry {
  ip: string
  hostname: string | null
}

export interface RdnsResultData {
  entries: RdnsEntry[]
  // Whether any PTR hostname matches the original target — null when the
  // target was already an IP, since there's no forward hostname to confirm against.
  forwardConfirmed: boolean | null
}

export interface HttpHeaderEntry {
  name: string
  value: string
}

export interface HttpHeadersResultData {
  url: string
  statusCode: number
  statusText: string
  headers: HttpHeaderEntry[]
  missingSecurityHeaders: string[]
}

export type PingReconResult = ReconResultBase<'ping', PingResultData>
export type DNSReconResult = ReconResultBase<'dns', DNSResultData>
export type PortScanReconResult = ReconResultBase<'portscan', PortScanResultData>
export type WhoisReconResult = ReconResultBase<'whois', WhoisResultData>
export type AsnReconResult = ReconResultBase<'asn', AsnResultData>
export type GeoReconResult = ReconResultBase<'geo', GeoResultData>
export type TracerouteReconResult = ReconResultBase<'traceroute', TracerouteResultData>
export type RdnsReconResult = ReconResultBase<'rdns', RdnsResultData>
export type HttpHeadersReconResult = ReconResultBase<'http', HttpHeadersResultData>

export type ReconResult =
  | PingReconResult
  | DNSReconResult
  | PortScanReconResult
  | WhoisReconResult
  | AsnReconResult
  | GeoReconResult
  | TracerouteReconResult
  | RdnsReconResult
  | HttpHeadersReconResult
