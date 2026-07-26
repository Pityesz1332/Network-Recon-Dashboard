import { spawn } from 'node:child_process'
import { platform } from 'node:os'
import { isIP } from 'node:net'
import dns from 'node:dns/promises'
import { TIMEOUTS } from '@shared/constants'
import type { TracerouteHopData, TracerouteResultData } from '@shared/types/recon'

function command(): string {
  return platform() === 'win32' ? 'tracert' : 'traceroute'
}

// -d/-n skip reverse DNS on each hop — we already have a DNS module for that,
// and resolving every hop would make an inherently slow command much slower.
function buildArgs(target: string): string[] {
  const maxHops = String(TIMEOUTS.tracerouteMaxHops)

  if (platform() === 'win32') {
    return ['-d', '-h', maxHops, '-w', String(TIMEOUTS.tracerouteHopTimeoutMs), target]
  }

  const timeoutSec = String(Math.max(1, Math.round(TIMEOUTS.tracerouteHopTimeoutMs / 1000)))
  return ['-n', '-m', maxHops, '-w', timeoutSec, target]
}

function parseWindowsHops(raw: string): TracerouteHopData[] {
  const hops: TracerouteHopData[] = []

  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*(\d+)\s+(.*\S)\s*$/)
    if (!match) continue

    const hop = Number(match[1])
    const rest = match[2]

    if (/Request timed out/i.test(rest)) {
      hops.push({ hop, ip: null, avgMs: null, timedOut: true })
      continue
    }

    const times = Array.from(rest.matchAll(/<?(\d+)\s*ms/gi)).map((m) => Number(m[1]))
    const ipMatch = rest.match(/(\d{1,3}(?:\.\d{1,3}){3}|[0-9a-f:]+:[0-9a-f:]+)\s*$/i)

    hops.push({
      hop,
      ip: ipMatch ? ipMatch[1] : null,
      avgMs: times.length > 0 ? Math.round(times.reduce((a, b) => a + b) / times.length) : null,
      timedOut: times.length === 0
    })
  }

  return hops
}

function parseUnixHops(raw: string): TracerouteHopData[] {
  const hops: TracerouteHopData[] = []

  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*(\d+)\s+(.*\S)\s*$/)
    if (!match) continue

    const hop = Number(match[1])
    const rest = match[2]

    const ipMatch = rest.match(/^(\d{1,3}(?:\.\d{1,3}){3}|[0-9a-f:]+)/i)
    const times = Array.from(rest.matchAll(/([\d.]+)\s*ms/gi)).map((m) => Number(m[1]))

    hops.push({
      hop,
      ip: ipMatch ? ipMatch[1] : null,
      avgMs: times.length > 0 ? Math.round(times.reduce((a, b) => a + b) / times.length) : null,
      timedOut: !ipMatch && times.length === 0
    })
  }

  return hops
}

function parseHops(raw: string): TracerouteHopData[] {
  return platform() === 'win32' ? parseWindowsHops(raw) : parseUnixHops(raw)
}

async function resolveToIp(target: string): Promise<string | null> {
  if (isIP(target)) return target
  try {
    const { address } = await dns.lookup(target, { family: 4 })
    return address
  } catch {
    return null
  }
}

function runTraceroute(target: string, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error('Traceroute cancelled'))
      return
    }

    const child = spawn(command(), buildArgs(target))
    let stdout = ''
    let stderr = ''

    const onAbort = (): void => {
      child.kill()
    }
    signal.addEventListener('abort', onAbort, { once: true })

    // Safety net: the command is already bounded by maxHops * hopTimeout, but
    // kill it outright if something unexpected keeps the process alive longer.
    const hardTimeout = setTimeout(() => {
      child.kill()
    }, TIMEOUTS.tracerouteHardTimeoutMs)

    function cleanup(): void {
      clearTimeout(hardTimeout)
      signal.removeEventListener('abort', onAbort)
    }

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString()
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    child.on('error', (err) => {
      cleanup()
      reject(err)
    })

    child.on('close', () => {
      cleanup()
      if (signal.aborted) {
        reject(new Error('Traceroute cancelled'))
        return
      }
      resolve(stdout || stderr)
    })
  })
}

export async function traceHost(
  target: string,
  signal: AbortSignal
): Promise<TracerouteResultData> {
  const [raw, targetIp] = await Promise.all([runTraceroute(target, signal), resolveToIp(target)])
  const hops = parseHops(raw)

  return {
    hops,
    reachedTarget: targetIp !== null && hops.some((h) => h.ip === targetIp),
    raw: raw.trim()
  }
}
