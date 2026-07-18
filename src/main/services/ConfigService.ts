import { DEFAULT_SCAN_PORTS, TIMEOUTS } from '@shared/constants'

// Thin pass-through today. A seam for future persisted user settings
// (e.g. custom port lists, saved timeouts) without touching module code.
export const ConfigService = {
  getScanPorts(): number[] {
    return DEFAULT_SCAN_PORTS
  },
  getTimeouts(): typeof TIMEOUTS {
    return TIMEOUTS
  }
}
