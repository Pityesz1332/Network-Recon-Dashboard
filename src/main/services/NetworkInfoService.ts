import { networkInterfaces } from 'node:os'
import { LAN_SWEEP } from '@shared/constants'
import type { LanNetworkInfo } from '@shared/types/lan'
import { hostAddressesForCidr, intToIp, ipToInt, netmaskToPrefixLength } from '../utils/subnet'

const VIRTUAL_ADAPTER_PATTERN = /vEthernet|VMware|VirtualBox|Loopback|Hyper-V/i

function isRfc1918(ip: string): boolean {
  const [a, b] = ip.split('.').map(Number)
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
}

export interface NetworkInfoResult {
  network: LanNetworkInfo
  hostIps: string[]
}

export function detectLocalNetwork(): NetworkInfoResult | null {
  const interfaces = networkInterfaces()

  const candidates: { name: string; address: string; netmask: string }[] = []
  for (const [name, addresses] of Object.entries(interfaces)) {
    if (!addresses || VIRTUAL_ADAPTER_PATTERN.test(name)) continue
    for (const addr of addresses) {
      if (addr.family === 'IPv4' && !addr.internal) {
        candidates.push({ name, address: addr.address, netmask: addr.netmask })
      }
    }
  }

  if (candidates.length === 0) return null

  const chosen = candidates.find((c) => isRfc1918(c.address)) ?? candidates[0]

  const addressInt = ipToInt(chosen.address)
  let prefixLength = netmaskToPrefixLength(chosen.netmask)
  const capped = prefixLength < LAN_SWEEP.minPrefixLength
  if (capped) prefixLength = LAN_SWEEP.minPrefixLength

  const hostBits = 32 - prefixLength
  const networkAddr = (addressInt & (~0 << hostBits)) >>> 0
  const hostIps = hostAddressesForCidr(networkAddr, prefixLength)

  const network: LanNetworkInfo = {
    interfaceName: chosen.name,
    localIp: chosen.address,
    cidr: `${intToIp(networkAddr)}/${prefixLength}`,
    prefixLength,
    totalHosts: hostIps.length,
    capped
  }

  return { network, hostIps }
}
