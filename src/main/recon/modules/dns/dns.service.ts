import { isIP } from 'node:net'
import dns from 'node:dns/promises'
import type { DNSResultData } from '@shared/types/recon'
import type { AddressRecordType } from './types'

function abortRejectPromise(signal: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    if (signal.aborted) {
      reject(new Error('DNS lookup cancelled'))
      return
    }
    signal.addEventListener('abort', () => reject(new Error('DNS lookup cancelled')), {
      once: true
    })
  })
}

async function resolveHostname(target: string): Promise<DNSResultData> {
  const [a4, a6, cname] = await Promise.allSettled([
    dns.resolve4(target),
    dns.resolve6(target),
    dns.resolveCname(target)
  ])

  const addresses: DNSResultData['addresses'] = []
  if (a4.status === 'fulfilled') {
    addresses.push(...a4.value.map((address) => ({ type: 'A' as AddressRecordType, address })))
  }
  if (a6.status === 'fulfilled') {
    addresses.push(...a6.value.map((address) => ({ type: 'AAAA' as AddressRecordType, address })))
  }

  if (addresses.length === 0 && a4.status === 'rejected' && a6.status === 'rejected') {
    throw a4.reason instanceof Error ? a4.reason : new Error('DNS resolution failed')
  }

  return {
    addresses,
    cname: cname.status === 'fulfilled' ? cname.value : [],
    hostname: null
  }
}

async function reverseLookupIp(target: string): Promise<DNSResultData> {
  let hostname: string | null = null
  try {
    const names = await dns.reverse(target)
    hostname = names[0] ?? null
  } catch {
    hostname = null
  }

  return {
    addresses: [{ type: isIP(target) === 6 ? 'AAAA' : 'A', address: target }],
    cname: [],
    hostname
  }
}

export async function lookupHost(target: string, signal: AbortSignal): Promise<DNSResultData> {
  const work = isIP(target) ? reverseLookupIp(target) : resolveHostname(target)
  return Promise.race([work, abortRejectPromise(signal)])
}
