import { isIP } from 'node:net'
import { TIMEOUTS } from '@shared/constants'
import type { HttpHeadersResultData } from '@shared/types/recon'

const SECURITY_HEADERS = [
  'strict-transport-security',
  'content-security-policy',
  'x-content-type-options',
  'x-frame-options',
  'referrer-policy'
]

function targetUrl(target: string, scheme: 'https' | 'http'): string {
  const host = isIP(target) === 6 ? `[${target}]` : target
  return `${scheme}://${host}/`
}

// HEAD avoids downloading a response body we don't care about, and is
// supported by essentially every web server (even a 405 back still carries
// the headers we're after).
function fetchHead(url: string, signal: AbortSignal): Promise<Response> {
  return fetch(url, {
    method: 'HEAD',
    redirect: 'follow',
    signal: AbortSignal.any([signal, AbortSignal.timeout(TIMEOUTS.httpHeadersMs)])
  })
}

export async function lookupHttpHeaders(
  target: string,
  signal: AbortSignal
): Promise<HttpHeadersResultData> {
  let response: Response
  let usedUrl = targetUrl(target, 'https')

  try {
    response = await fetchHead(usedUrl, signal)
  } catch (httpsErr) {
    if (signal.aborted) throw httpsErr

    usedUrl = targetUrl(target, 'http')
    try {
      response = await fetchHead(usedUrl, signal)
    } catch {
      throw new Error(`No HTTP(S) service reachable on ${target}`)
    }
  }

  const headers: { name: string; value: string }[] = []
  response.headers.forEach((value, name) => headers.push({ name, value }))
  headers.sort((a, b) => a.name.localeCompare(b.name))

  const presentHeaderNames = new Set(headers.map((h) => h.name.toLowerCase()))
  const missingSecurityHeaders = SECURITY_HEADERS.filter((h) => !presentHeaderNames.has(h))

  return {
    url: response.url || usedUrl,
    statusCode: response.status,
    statusText: response.statusText,
    headers,
    missingSecurityHeaders
  }
}
