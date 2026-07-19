export function ipToInt(ip: string): number {
  const parts = ip.split('.').map(Number)
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0
}

export function intToIp(n: number): string {
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff].join('.')
}

export function netmaskToPrefixLength(netmask: string): number {
  return ipToInt(netmask)
    .toString(2)
    .split('')
    .filter((bit) => bit === '1').length
}

/** Excludes the network and broadcast addresses for prefix lengths < 31. */
export function hostAddressesForCidr(networkAddr: number, prefixLength: number): string[] {
  const hostBits = 32 - prefixLength
  const totalAddresses = 2 ** hostBits
  if (prefixLength >= 31) {
    return Array.from({ length: totalAddresses }, (_, i) => intToIp(networkAddr + i))
  }

  const hosts: string[] = []
  for (let i = 1; i < totalAddresses - 1; i++) {
    hosts.push(intToIp(networkAddr + i))
  }
  return hosts
}
