import type { ReconModuleId } from '../types/recon'

export const RECON_MODULE_IDS: ReconModuleId[] = [
  'ping',
  'dns',
  'portscan',
  'whois',
  'asn',
  'geo',
  'traceroute'
]

export const DEFAULT_SCAN_PORTS: number[] = [
  21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 8080, 8443
]

export const TIMEOUTS = {
  pingMs: 8000,
  dnsMs: 5000,
  portScanConnectMs: 1000,
  whoisMs: 8000,
  asnMs: 8000,
  geoMs: 8000,
  tracerouteMaxHops: 16,
  tracerouteHopTimeoutMs: 800,
  tracerouteHardTimeoutMs: 45000
} as const

export const LAN_SWEEP = {
  concurrency: 32,
  minPrefixLength: 24,
  pingTimeoutMs: 800,
  reverseDnsTimeoutMs: 1200
} as const
