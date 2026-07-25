import { connect, isIP } from 'node:net'
import dns from 'node:dns/promises'
import { TIMEOUTS } from '@shared/constants'
import type { AsnResultData } from '@shared/types/recon'

const CYMRU_WHOIS_SERVER = 'whois.cymru.com'
const WHOIS_PORT = 43

function queryCymru(ip: string, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error('ASN lookup cancelled'))
      return
    }

    const socket = connect({ host: CYMRU_WHOIS_SERVER, port: WHOIS_PORT, timeout: TIMEOUTS.asnMs })
    const chunks: Buffer[] = []

    const onAbort = (): void => {
      socket.destroy()
      reject(new Error('ASN lookup cancelled'))
    }
    signal.addEventListener('abort', onAbort, { once: true })

    function cleanup(): void {
      signal.removeEventListener('abort', onAbort)
      socket.removeAllListeners()
    }

    socket.once('connect', () => socket.write(` -v ${ip}\r\n`))
    socket.on('data', (chunk: Buffer) => chunks.push(chunk))
    socket.once('timeout', () => {
      cleanup()
      socket.destroy()
      reject(new Error(`ASN query to ${CYMRU_WHOIS_SERVER} timed out`))
    })
    socket.once('error', (err) => {
      cleanup()
      reject(err)
    })
    socket.once('close', () => {
      cleanup()
      resolve(Buffer.concat(chunks).toString('utf8'))
    })
  })
}

async function resolveToIp(target: string): Promise<string> {
  if (isIP(target)) return target
  const { address } = await dns.lookup(target)
  return address
}

function parseCymruResponse(raw: string, queriedIp: string): AsnResultData {
  const dataLine = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)[1]

  if (!dataLine) {
    return {
      queriedIp,
      asn: null,
      asName: null,
      bgpPrefix: null,
      countryCode: null,
      registry: null,
      allocatedDate: null,
      raw: raw.trim()
    }
  }

  const [as, , bgpPrefix, cc, registry, allocated, asName] = dataLine
    .split('|')
    .map((field) => field.trim())

  return {
    queriedIp,
    asn: as && as !== 'NA' ? Number(as) : null,
    asName: asName || null,
    bgpPrefix: bgpPrefix && bgpPrefix !== 'NA' ? bgpPrefix : null,
    countryCode: cc && cc !== 'NA' ? cc : null,
    registry: registry && registry !== 'NA' ? registry : null,
    allocatedDate: allocated && allocated !== 'NA' ? allocated : null,
    raw: raw.trim()
  }
}

export async function lookupAsn(target: string, signal: AbortSignal): Promise<AsnResultData> {
  const ip = await resolveToIp(target)
  const raw = await queryCymru(ip, signal)
  return parseCymruResponse(raw, ip)
}
