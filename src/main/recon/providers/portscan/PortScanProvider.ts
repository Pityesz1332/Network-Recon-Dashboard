export interface PortProbeResult {
  port: number
  open: boolean
}

export interface PortScanProvider {
  scan(target: string, ports: number[], signal: AbortSignal): Promise<PortProbeResult[]>
}
