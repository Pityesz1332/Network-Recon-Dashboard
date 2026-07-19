export interface LanDevice {
  ip: string
  mac: string | null
  hostname: string | null
  alive: boolean
  rttMs: number | null
}

export interface LanNetworkInfo {
  interfaceName: string
  localIp: string
  cidr: string
  prefixLength: number
  totalHosts: number
  capped: boolean
}
