import { isIP } from 'node:net'
import dns from 'node:dns/promises'
import { TIMEOUTS } from '@shared/constants'
import type { GeoResultData } from '@shared/types/recon'

interface IpApiCoResponse {
  error?: boolean
  reason?: string
  city?: string
  region?: string
  country_name?: string
  country_code?: string
  latitude?: number
  longitude?: number
  timezone?: string
  org?: string
}

async function resolveToIp(target: string): Promise<string> {
  if (isIP(target)) return target
  const { address } = await dns.lookup(target)
  return address
}

export async function lookupGeo(target: string, signal: AbortSignal): Promise<GeoResultData> {
  const ip = await resolveToIp(target)

  const response = await fetch(`https://ipapi.co/${ip}/json/`, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(TIMEOUTS.geoMs)])
  })

  if (!response.ok) {
    throw new Error(`Geolocation lookup failed with status ${response.status}`)
  }

  const body: IpApiCoResponse = await response.json()
  if (body.error) {
    throw new Error(body.reason ?? 'Geolocation lookup failed')
  }

  return {
    queriedIp: ip,
    country: body.country_name ?? null,
    countryCode: body.country_code ?? null,
    region: body.region ?? null,
    city: body.city ?? null,
    latitude: typeof body.latitude === 'number' ? body.latitude : null,
    longitude: typeof body.longitude === 'number' ? body.longitude : null,
    timezone: body.timezone ?? null,
    isp: body.org ?? null
  }
}
