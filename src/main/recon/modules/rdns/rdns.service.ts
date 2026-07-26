import { isIP } from 'node:net'
import dns from 'node:dns/promises'
import type { RdnsResultData } from '@shared/types/recon'

function abortRejectPromise(signal: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    if (signal.aborted) {
      reject(new Error('Reverse DNS lookup cancelled'))
      return
    }
    signal.addEventListener('abort', () => reject(new Error('Reverse DNS lookup cancelled')), {
      once: true
    })
  })
}

function normalizeHost(host: string): string {
  return host.toLowerCase().replace(/\.$/, '')
}

async function resolveIps(target: string): Promise<string[]> {
  if (isIP(target)) return [target]

  const [a4, a6] = await Promise.allSettled([dns.resolve4(target), dns.resolve6(target)])
  const ips: string[] = []
  if (a4.status === 'fulfilled') ips.push(...a4.value)
  if (a6.status === 'fulfilled') ips.push(...a6.value)

  if (ips.length === 0) {
    const reason =
      a4.status === 'rejected' ? a4.reason : a6.status === 'rejected' ? a6.reason : null
    throw reason instanceof Error ? reason : new Error('Could not resolve target to an IP address')
  }

  return ips
}

async function reversePtr(ip: string): Promise<string | null> {
  try {
    const names = await dns.reverse(ip)
    return names[0] ?? null
  } catch {
    return null
  }
}

async function performLookup(target: string): Promise<RdnsResultData> {
  const ips = await resolveIps(target)
  const entries = await Promise.all(ips.map(async (ip) => ({ ip, hostname: await reversePtr(ip) })))

  const forwardConfirmed = isIP(target)
    ? null
    : entries.some(
        (e) => e.hostname !== null && normalizeHost(e.hostname) === normalizeHost(target)
      )

  return { entries, forwardConfirmed }
}

export function lookupRdns(target: string, signal: AbortSignal): Promise<RdnsResultData> {
  return Promise.race([performLookup(target), abortRejectPromise(signal)])
}
