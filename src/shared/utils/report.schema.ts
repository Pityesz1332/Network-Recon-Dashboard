import { z } from 'zod'
import { RECON_MODULE_IDS } from '../constants'
import type { ReconModuleId } from '../types/recon'
import { targetSchema } from './target.schema'

const moduleIdSchema = z
  .string()
  .refine((v) => RECON_MODULE_IDS.includes(v as ReconModuleId), 'Unknown recon module id')

// Envelope validation only. The per-module `data` shapes are produced by the
// modules themselves; the report reads known fields defensively and HTML-escapes
// every value it prints, so a malformed payload can garble text but not inject markup.
const reconResultSchema = z.object({
  moduleId: moduleIdSchema,
  moduleName: z.string(),
  status: z.enum(['idle', 'running', 'success', 'error']),
  startedAt: z.number().nullable(),
  finishedAt: z.number().nullable(),
  durationMs: z.number().nullable(),
  data: z.unknown().nullable(),
  error: z.string().nullable()
})

export const exportPdfRequestSchema = z.object({
  target: targetSchema,
  startedAt: z.number(),
  finishedAt: z.number().nullable(),
  totalDurationMs: z.number().nullable(),
  results: z.array(reconResultSchema).min(1, 'Nothing to export').max(RECON_MODULE_IDS.length)
})
