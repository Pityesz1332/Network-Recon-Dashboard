import { connect } from 'node:net'
import { TIMEOUTS } from '@shared/constants'
import type { WhoisResultData } from '@shared/types/recon'

const IANA_WHOIS_SERVER = 'whois.iana.org'
const WHOIS_PORT = 43

function queryWhoisServer(server: string, query: string, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error('WHOIS lookup cancelled'))
      return
    }

    const socket = connect({ host: server, port: WHOIS_PORT, timeout: TIMEOUTS.whoisMs })
    const chunks: Buffer[] = []

    const onAbort = (): void => {
      socket.destroy()
      reject(new Error('WHOIS lookup cancelled'))
    }
    signal.addEventListener('abort', onAbort, { once: true })

    function cleanup(): void {
      signal.removeEventListener('abort', onAbort)
      socket.removeAllListeners()
    }

    socket.once('connect', () => socket.write(`${query}\r\n`))
    socket.on('data', (chunk: Buffer) => chunks.push(chunk))
    socket.once('timeout', () => {
      cleanup()
      socket.destroy()
      reject(new Error(`WHOIS query to ${server} timed out`))
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

// IANA is the root WHOIS server: it doesn't hold registration data itself but
// points us at the authoritative server (a registrar for domains, a regional
// registry like ARIN/RIPE for IPs) via a "refer:" line.
function extractReferral(raw: string): string | null {
  const match = raw.match(/^\s*(?:refer|ReferralServer|whois)\s*:\s*(?:whois:\/\/)?(\S+)/im)
  return match ? match[1].replace(/\/$/, '') : null
}

function extractField(raw: string, labels: string[]): string | null {
  for (const label of labels) {
    const match = raw.match(new RegExp(`^${label}\\s*:\\s*(.+)$`, 'im'))
    if (match) return match[1].trim()
  }
  return null
}

function extractNameServers(raw: string): string[] {
  const servers = new Set<string>()
  const re = /^(?:Name Server|nserver|nameserver)\s*:\s*(\S+)/gim
  let match: RegExpExecArray | null
  while ((match = re.exec(raw)) !== null) {
    servers.add(match[1].toLowerCase().replace(/\.$/, ''))
  }
  return Array.from(servers)
}

export async function lookupWhois(target: string, signal: AbortSignal): Promise<WhoisResultData> {
  const referral = await queryWhoisServer(IANA_WHOIS_SERVER, target, signal)
  const referredServer = extractReferral(referral)

  const raw = referredServer ? await queryWhoisServer(referredServer, target, signal) : referral
  const server = referredServer ?? IANA_WHOIS_SERVER

  return {
    raw: raw.trim(),
    server,
    registrar: extractField(raw, ['Registrar', 'org-name', 'OrgName']),
    createdDate: extractField(raw, ['Creation Date', 'created', 'Registered']),
    updatedDate: extractField(raw, ['Updated Date', 'last-modified', 'changed']),
    expiresDate: extractField(raw, [
      'Registry Expiry Date',
      'Expiration Date',
      'expire',
      'paid-till'
    ]),
    nameServers: extractNameServers(raw)
  }
}
