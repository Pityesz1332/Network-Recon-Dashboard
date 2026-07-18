import { z } from 'zod'

const IPV4_RE = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/
const HOSTNAME_RE = /^(?=.{1,253}$)(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))*$/

export const targetSchema = z
  .string()
  .trim()
  .min(1, 'Target is required')
  .max(253, 'Target is too long')
  .refine((v) => IPV4_RE.test(v) || HOSTNAME_RE.test(v), 'Enter a valid IPv4 address or hostname')

export type ScanTarget = z.infer<typeof targetSchema>
