import type { ReconModuleId } from '../types/recon'

export const RECON_MODULE_IDS: ReconModuleId[] = ['ping', 'dns', 'portscan']

export const DEFAULT_SCAN_PORTS: number[] = [
  21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 8080, 8443
]

export const TIMEOUTS = {
  pingMs: 8000,
  dnsMs: 5000,
  portScanConnectMs: 1000
} as const
