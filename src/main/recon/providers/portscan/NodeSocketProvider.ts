import { connect } from 'node:net'
import { TIMEOUTS } from '@shared/constants'
import type { PortProbeResult, PortScanProvider } from './PortScanProvider'

function probePort(host: string, port: number, signal: AbortSignal): Promise<PortProbeResult> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve({ port, open: false })
      return
    }

    const socket = connect({ host, port, timeout: TIMEOUTS.portScanConnectMs })

    const onAbort = (): void => finish(false)

    function finish(open: boolean): void {
      socket.removeAllListeners()
      socket.destroy()
      signal.removeEventListener('abort', onAbort)
      resolve({ port, open })
    }

    signal.addEventListener('abort', onAbort, { once: true })

    socket.once('connect', () => finish(true))
    socket.once('timeout', () => finish(false))
    socket.once('error', () => finish(false))
  })
}

export class NodeSocketProvider implements PortScanProvider {
  async scan(target: string, ports: number[], signal: AbortSignal): Promise<PortProbeResult[]> {
    return Promise.all(ports.map((port) => probePort(target, port, signal)))
  }
}
