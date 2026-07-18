export interface PingStats {
  packetsSent: number
  packetsReceived: number
  packetLossPct: number
  minMs: number | null
  avgMs: number | null
  maxMs: number | null
}
