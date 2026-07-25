import ouiMap from './oui-data.json'

const OUI_MAP: Record<string, string> = ouiMap

/**
 * Bit 0x02 of the first octet marks a "locally administered" address. Modern phones/tablets
 * randomize this for Wi-Fi privacy, so the OUI carries no manufacturer info at all — that's
 * a distinct, expected state, not a lookup miss.
 */
function isRandomized(firstByteHex: string): boolean {
  return (parseInt(firstByteHex, 16) & 0x02) !== 0
}

export function lookupVendor(mac: string | null): string | null {
  if (!mac) return null
  const hex = mac.replace(/[:-]/g, '').toUpperCase()
  if (hex.length < 6) return null
  if (isRandomized(hex.slice(0, 2))) return 'Randomized (private MAC)'
  return OUI_MAP[hex.slice(0, 6)] ?? null
}
