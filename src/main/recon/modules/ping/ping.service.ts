import { spawn } from 'node:child_process'
import { platform } from 'node:os'
import type { PingResultData } from '@shared/types/recon'
import type { PingStats } from './types'

function buildArgs(target: string): string[] {
  switch (platform()) {
    case 'win32':
      return ['-n', '4', '-w', '2000', target]
    case 'darwin':
      return ['-c', '4', '-t', '2', target]
    default:
      return ['-c', '4', '-W', '2', target]
  }
}

function parseStats(raw: string): PingStats {
  const winPackets = raw.match(
    /Packets:\s*Sent = (\d+),\s*Received = (\d+),\s*Lost = \d+ \((\d+)% loss\)/
  )
  const winTimes = raw.match(/Minimum = (\d+)ms, Maximum = (\d+)ms, Average = (\d+)ms/)
  if (winPackets) {
    return {
      packetsSent: Number(winPackets[1]),
      packetsReceived: Number(winPackets[2]),
      packetLossPct: Number(winPackets[3]),
      minMs: winTimes ? Number(winTimes[1]) : null,
      avgMs: winTimes ? Number(winTimes[3]) : null,
      maxMs: winTimes ? Number(winTimes[2]) : null
    }
  }

  const unixPackets = raw.match(
    /(\d+) packets transmitted, (\d+)(?: packets)? received,.*?(\d+(?:\.\d+)?)% packet loss/
  )
  const unixTimes = raw.match(/=\s*([\d.]+)\/([\d.]+)\/([\d.]+)/)
  if (unixPackets) {
    return {
      packetsSent: Number(unixPackets[1]),
      packetsReceived: Number(unixPackets[2]),
      packetLossPct: Number(unixPackets[3]),
      minMs: unixTimes ? Number(unixTimes[1]) : null,
      avgMs: unixTimes ? Number(unixTimes[2]) : null,
      maxMs: unixTimes ? Number(unixTimes[3]) : null
    }
  }

  return {
    packetsSent: 0,
    packetsReceived: 0,
    packetLossPct: 100,
    minMs: null,
    avgMs: null,
    maxMs: null
  }
}

export function pingHost(target: string, signal: AbortSignal): Promise<PingResultData> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error('Ping cancelled'))
      return
    }

    const child = spawn('ping', buildArgs(target))
    let stdout = ''
    let stderr = ''

    const onAbort = (): void => {
      child.kill()
    }
    signal.addEventListener('abort', onAbort, { once: true })

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString()
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    child.on('error', (err) => {
      signal.removeEventListener('abort', onAbort)
      reject(err)
    })

    child.on('close', (code) => {
      signal.removeEventListener('abort', onAbort)
      if (signal.aborted) {
        reject(new Error('Ping cancelled'))
        return
      }
      const stats = parseStats(stdout)
      resolve({
        alive: code === 0,
        ...stats,
        raw: stdout || stderr
      })
    })
  })
}
