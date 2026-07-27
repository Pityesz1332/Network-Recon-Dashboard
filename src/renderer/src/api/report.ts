import type { ExportPdfRequest, ExportPdfResponse } from '@shared/types/ipc'

export function exportPdf(payload: ExportPdfRequest): Promise<ExportPdfResponse> {
  return window.api.report.exportPdf(payload)
}
