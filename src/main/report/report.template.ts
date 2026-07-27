import type { ExportPdfRequest } from '@shared/types/ipc'
import type {
  AsnResultData,
  DNSResultData,
  GeoResultData,
  HttpHeadersResultData,
  PingResultData,
  PortScanResultData,
  RdnsResultData,
  ReconResult,
  ReconStatus,
  TracerouteResultData,
  WhoisResultData
} from '@shared/types/recon'

// Naming convention in this file: anything ending in `Html` produces or accepts
// trusted markup. Every other helper takes raw text and escapes it, so values
// coming from remote servers (WHOIS text, HTTP header values, PTR hostnames)
// can never inject markup into the report.

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

type Cell = string | number | null | undefined

function text(value: Cell): string {
  if (value === null || value === undefined || value === '') return '&mdash;'
  return escapeHtml(value)
}

function toArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : []
}

function ms(value: number | null | undefined): string {
  return typeof value === 'number' ? `${value} ms` : '—'
}

function formatDuration(value: number | null): string {
  if (typeof value !== 'number') return '—'
  return value < 1000 ? `${value} ms` : `${(value / 1000).toFixed(1)} s`
}

function formatTimestamp(value: number | null): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  return new Date(value).toLocaleString()
}

function kvHtml(rows: Array<[string, Cell]>): string {
  const cells = rows
    .map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${text(value)}</dd>`)
    .join('')
  return `<dl class="kv">${cells}</dl>`
}

function tableHtml(headers: string[], rows: Cell[][]): string {
  const head = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')
  const body = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${text(cell)}</td>`).join('')}</tr>`)
    .join('')
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
}

function listHtml(items: Cell[]): string {
  return `<ul class="plain">${items.map((item) => `<li>${text(item)}</li>`).join('')}</ul>`
}

function chipsHtml(items: Cell[], variant: 'neutral' | 'danger' = 'neutral'): string {
  const chips = items.map((item) => `<li class="chip ${variant}">${text(item)}</li>`).join('')
  return `<ul class="chips">${chips}</ul>`
}

function sectionHtml(label: string, bodyHtml: string): string {
  return `<div class="subsection"><h4>${escapeHtml(label)}</h4>${bodyHtml}</div>`
}

function noteHtml(note: string): string {
  return `<p class="note">${escapeHtml(note)}</p>`
}

const EMPTY_HTML = '<p class="muted">No data returned.</p>'

function renderPing(d: PingResultData): string {
  const rtt =
    d.minMs === null && d.avgMs === null && d.maxMs === null
      ? null
      : `${ms(d.minMs)} / ${ms(d.avgMs)} / ${ms(d.maxMs)}`
  return kvHtml([
    ['Reachability', d.alive ? 'Alive' : 'Unreachable'],
    ['Packets', `${d.packetsReceived} received of ${d.packetsSent} sent`],
    ['Packet loss', `${d.packetLossPct}%`],
    ['RTT min / avg / max', rtt]
  ])
}

function renderDns(d: DNSResultData): string {
  const addresses = toArray(d.addresses)
  const cnames = toArray(d.cname)
  const records = addresses.length
    ? tableHtml(
        ['Type', 'Address'],
        addresses.map((a) => [a.type, a.address])
      )
    : '<p class="muted">No A/AAAA records found.</p>'
  return [
    kvHtml([['PTR hostname', d.hostname]]),
    sectionHtml('Address records', records),
    cnames.length ? sectionHtml('CNAME', listHtml(cnames)) : ''
  ].join('')
}

function renderPortScan(d: PortScanResultData): string {
  const open = toArray(d.ports).filter((p) => p.open)
  return [
    kvHtml([
      ['Ports scanned', d.scannedCount],
      ['Open ports', d.openCount]
    ]),
    open.length
      ? sectionHtml('Open', chipsHtml(open.map((p) => p.port)))
      : '<p class="muted">No open ports among the scanned list.</p>'
  ].join('')
}

function renderWhois(d: WhoisResultData): string {
  const nameServers = toArray(d.nameServers)
  return [
    kvHtml([
      ['WHOIS server', d.server],
      ['Registrar', d.registrar],
      ['Created', d.createdDate],
      ['Updated', d.updatedDate],
      ['Expires', d.expiresDate]
    ]),
    nameServers.length ? sectionHtml('Name servers', listHtml(nameServers)) : ''
  ].join('')
}

function renderAsn(d: AsnResultData): string {
  return kvHtml([
    ['Queried IP', d.queriedIp],
    ['ASN', d.asn !== null ? `AS${d.asn}` : null],
    ['Organisation', d.asName],
    ['BGP prefix', d.bgpPrefix],
    ['Country', d.countryCode],
    ['Registry', d.registry],
    ['Allocated', d.allocatedDate]
  ])
}

function renderGeo(d: GeoResultData): string {
  const location = [d.city, d.region, d.country].filter(Boolean).join(', ')
  const coordinates =
    d.latitude !== null && d.longitude !== null
      ? `${d.latitude.toFixed(4)}, ${d.longitude.toFixed(4)}`
      : null
  return kvHtml([
    ['Queried IP', d.queriedIp],
    ['Location', location],
    ['Coordinates', coordinates],
    ['Timezone', d.timezone],
    ['ISP', d.isp]
  ])
}

function renderTraceroute(d: TracerouteResultData): string {
  const hops = toArray(d.hops)
  if (hops.length === 0) return '<p class="muted">No hops recorded.</p>'
  const rows = hops.map((hop) => [
    hop.hop,
    hop.timedOut ? 'Request timed out' : hop.ip,
    hop.timedOut ? '—' : ms(hop.avgMs)
  ])
  return [
    tableHtml(['Hop', 'Address', 'Avg RTT'], rows),
    d.reachedTarget
      ? noteHtml('Target reached.')
      : noteHtml('Did not reach the target within the hop limit.')
  ].join('')
}

function renderRdns(d: RdnsResultData): string {
  const entries = toArray(d.entries)
  if (entries.length === 0) return '<p class="muted">No PTR records found.</p>'
  return [
    tableHtml(
      ['IP', 'PTR hostname'],
      entries.map((e) => [e.ip, e.hostname ?? 'No PTR record'])
    ),
    d.forwardConfirmed === null
      ? ''
      : noteHtml(
          d.forwardConfirmed
            ? 'Forward-confirmed: a PTR hostname resolves back to the target.'
            : 'Not forward-confirmed: no PTR hostname resolves back to the target.'
        )
  ].join('')
}

function renderHttpHeaders(d: HttpHeadersResultData): string {
  const headers = toArray(d.headers)
  const missing = toArray(d.missingSecurityHeaders)
  return [
    kvHtml([
      ['URL', d.url],
      ['Status', `${d.statusCode} ${d.statusText}`.trim()]
    ]),
    missing.length
      ? sectionHtml('Missing security headers', chipsHtml(missing, 'danger'))
      : noteHtml('All checked security headers are present.'),
    headers.length
      ? sectionHtml(
          'Response headers',
          tableHtml(
            ['Header', 'Value'],
            headers.map((h) => [h.name, h.value])
          )
        )
      : ''
  ].join('')
}

function withData<T>(data: T | null, render: (data: T) => string): string {
  return data ? render(data) : EMPTY_HTML
}

function renderModuleBodyHtml(result: ReconResult): string {
  if (result.status === 'error') {
    return `<p class="error">${text(result.error ?? 'Module failed without an error message.')}</p>`
  }
  if (result.status !== 'success') {
    return `<p class="muted">${
      result.status === 'running' ? 'Still running when the report was generated.' : 'Did not run.'
    }</p>`
  }

  switch (result.moduleId) {
    case 'ping':
      return withData(result.data, renderPing)
    case 'dns':
      return withData(result.data, renderDns)
    case 'portscan':
      return withData(result.data, renderPortScan)
    case 'whois':
      return withData(result.data, renderWhois)
    case 'asn':
      return withData(result.data, renderAsn)
    case 'geo':
      return withData(result.data, renderGeo)
    case 'traceroute':
      return withData(result.data, renderTraceroute)
    case 'rdns':
      return withData(result.data, renderRdns)
    case 'http':
      return withData(result.data, renderHttpHeaders)
    default:
      return EMPTY_HTML
  }
}

const STATUS_LABELS: Record<ReconStatus, string> = {
  idle: 'Not run',
  running: 'Incomplete',
  success: 'Success',
  error: 'Error'
}

function renderModuleHtml(result: ReconResult): string {
  const title = result.moduleName || result.moduleId
  return `<article class="module">
      <header>
        <h3>${escapeHtml(title)}</h3>
        <span class="pill ${escapeHtml(result.status)}">${escapeHtml(STATUS_LABELS[result.status] ?? result.status)}</span>
      </header>
      ${result.durationMs !== null ? `<p class="duration">${escapeHtml(formatDuration(result.durationMs))}</p>` : ''}
      ${renderModuleBodyHtml(result)}
    </article>`
}

const STYLES = `
  :root {
    --ink: #16161a;
    --muted: #6b6b76;
    --line: #e2e2e8;
    --accent: oklch(0.52 0.22 277);
    --ok: oklch(0.52 0.15 149);
    --bad: oklch(0.52 0.2 22);
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    color: var(--ink);
    background: #fff;
    font: 11px/1.5 -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  h1, h2, h3, h4 { margin: 0; font-weight: 600; }
  .report-header { border-bottom: 2px solid var(--accent); padding-bottom: 12px; }
  .brand {
    color: var(--accent);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .report-header h1 { font-size: 20px; margin-top: 6px; }
  .report-header .target {
    font-family: "Cascadia Mono", Consolas, "SF Mono", monospace;
    font-size: 13px;
    color: var(--accent);
    margin-top: 2px;
    word-break: break-all;
  }
  .meta {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin: 14px 0 0;
  }
  .meta div { border-left: 2px solid var(--line); padding-left: 8px; }
  .meta dt { color: var(--muted); font-size: 8.5px; letter-spacing: 0.06em; text-transform: uppercase; }
  .meta dd { margin: 2px 0 0; font-size: 11px; font-weight: 600; }
  .tally { display: flex; gap: 14px; margin: 12px 0 18px; font-size: 10px; }
  .tally span::before {
    content: "";
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    margin-right: 5px;
    background: var(--muted);
  }
  .tally .ok::before { background: var(--ok); }
  .tally .bad::before { background: var(--bad); }
  .modules { display: flex; flex-direction: column; gap: 10px; }
  .module {
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 10px 12px 12px;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .module > header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border-bottom: 1px solid var(--line);
    padding-bottom: 6px;
    margin-bottom: 8px;
  }
  .module h3 { font-size: 12.5px; }
  .pill {
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 1px 8px;
    font-size: 8.5px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .pill.success { color: var(--ok); border-color: var(--ok); }
  .pill.error { color: var(--bad); border-color: var(--bad); }
  .duration { color: var(--muted); margin: 0 0 8px; }
  .muted, .note { color: var(--muted); margin: 6px 0 0; }
  .error { color: var(--bad); margin: 0; }
  .kv { display: grid; grid-template-columns: 130px 1fr; gap: 3px 12px; margin: 0; }
  .kv dt { color: var(--muted); }
  .kv dd { margin: 0; word-break: break-word; }
  .subsection { margin-top: 10px; }
  .subsection h4 {
    color: var(--muted);
    font-size: 8.5px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th, td {
    border-bottom: 1px solid var(--line);
    padding: 3px 6px 3px 0;
    text-align: left;
    vertical-align: top;
    word-break: break-word;
  }
  th {
    color: var(--muted);
    font-size: 8.5px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  ul { margin: 0; padding: 0; list-style: none; }
  .plain li { padding: 2px 0; border-bottom: 1px solid var(--line); word-break: break-all; }
  .chips { display: flex; flex-wrap: wrap; gap: 4px; }
  .chip {
    border: 1px solid var(--line);
    border-radius: 4px;
    padding: 1px 7px;
    font-family: "Cascadia Mono", Consolas, "SF Mono", monospace;
  }
  .chip.danger { color: var(--bad); border-color: var(--bad); }
`

export function buildReportHtml(request: ExportPdfRequest): string {
  const results = toArray(request.results)
  const succeeded = results.filter((r) => r.status === 'success').length
  const failed = results.filter((r) => r.status === 'error').length
  const incomplete = results.length - succeeded - failed

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Recon report — ${escapeHtml(request.target)}</title>
<style>${STYLES}</style>
</head>
<body>
  <header class="report-header">
    <p class="brand">Network Recon Dashboard</p>
    <h1>Reconnaissance report</h1>
    <p class="target">${escapeHtml(request.target)}</p>
    <dl class="meta">
      <div><dt>Scan started</dt><dd>${escapeHtml(formatTimestamp(request.startedAt))}</dd></div>
      <div><dt>Scan finished</dt><dd>${escapeHtml(formatTimestamp(request.finishedAt))}</dd></div>
      <div><dt>Total duration</dt><dd>${escapeHtml(formatDuration(request.totalDurationMs))}</dd></div>
      <div><dt>Report generated</dt><dd>${escapeHtml(formatTimestamp(Date.now()))}</dd></div>
    </dl>
  </header>
  <p class="tally">
    <span class="ok">${succeeded} succeeded</span>
    <span class="bad">${failed} failed</span>
    <span>${incomplete} not completed</span>
  </p>
  <main class="modules">
    ${results.map(renderModuleHtml).join('\n')}
  </main>
</body>
</html>`
}
