import { spawn } from 'node:child_process'
import { platform } from 'node:os'
import { LAN_SWEEP } from '@shared/constants'
import type { LanDevice } from '@shared/types/lan'
import { buildArgs } from '../recon/modules/ping/ping.service'
import { reverseDns } from '../recon/modules/dns/dns.service'
import { runWithConcurrency } from '../utils/concurrency'
import { lookupVendor } from './oui.service'

function parseRttMs(raw: string): number | null {
  const winMatch = raw.match(/time[=<](\d+)\s*ms/i)
  if (winMatch) return Number(winMatch[1])
  const unixMatch = raw.match(/time=([\d.]+)\s*ms/i)
  if (unixMatch) return Number(unixMatch[1])
  return null
}

export function pingCheck(
  ip: string,
  signal: AbortSignal
): Promise<{ alive: boolean; rttMs: number | null }> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve({ alive: false, rttMs: null })
      return
    }

    const child = spawn('ping', buildArgs(ip, { count: 1, timeoutSec: 1 }))
    let stdout = ''

    const onAbort = (): void => {
      child.kill()
    }
    signal.addEventListener('abort', onAbort, { once: true })

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString()
    })

    child.on('error', () => {
      signal.removeEventListener('abort', onAbort)
      resolve({ alive: false, rttMs: null })
    })

    child.on('close', (code) => {
      signal.removeEventListener('abort', onAbort)
      resolve({ alive: code === 0, rttMs: code === 0 ? parseRttMs(stdout) : null })
    })
  })
}

function spawnCapture(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args)
    let stdout = ''
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString()
    })
    child.on('error', () => resolve(''))
    child.on('close', () => resolve(stdout))
  })
}

const WIN_ARP_RE = /^\s*(\d{1,3}(?:\.\d{1,3}){3})\s+([0-9a-f-]{17})\s+\w+/gim
const UNIX_ARP_RE = /\(((?:\d{1,3}\.){3}\d{1,3})\)\s+at\s+([0-9a-f:]{17})/gim

/** Must run after the ping pass — the OS ARP cache only holds entries for recently-contacted hosts. */
export async function runArp(): Promise<Map<string, string>> {
  const raw = await spawnCapture('arp', ['-a'])
  const map = new Map<string, string>()
  const re = platform() === 'win32' ? WIN_ARP_RE : UNIX_ARP_RE
  for (const match of raw.matchAll(re)) {
    const [, ip, mac] = match
    map.set(ip, mac.replace(/-/g, ':').toUpperCase())
  }
  return map
}

export async function sweepSubnet(
  hostIps: string[],
  signal: AbortSignal,
  onDeviceFound: (device: LanDevice) => void
): Promise<number> {
  const aliveHosts: { ip: string; rttMs: number | null }[] = []

  await runWithConcurrency(
    hostIps,
    LAN_SWEEP.concurrency,
    async (ip) => {
      const result = await pingCheck(ip, signal)
      if (result.alive) aliveHosts.push({ ip, rttMs: result.rttMs })
    },
    signal
  )

  if (signal.aborted) return 0

  const arpMap = await runArp()

  let count = 0
  await Promise.all(
    aliveHosts.map(async ({ ip, rttMs }) => {
      if (signal.aborted) return
      const hostname = await Promise.race([
        reverseDns(ip),
        new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), LAN_SWEEP.reverseDnsTimeoutMs)
        )
      ])
      if (signal.aborted) return
      const mac = arpMap.get(ip) ?? null
      count++
      onDeviceFound({ ip, mac, hostname, vendor: lookupVendor(mac), alive: true, rttMs })
    })
  )

  return count
}
