import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  type IpcMainInvokeEvent,
  type SaveDialogOptions
} from 'electron'
import { IPC, type ExportPdfRequest, type ExportPdfResponse } from '@shared/types/ipc'
import type { ReconResult } from '@shared/types/recon'
import { exportPdfRequestSchema } from '@shared/utils/report.schema'
import { buildReportHtml } from '../report/report.template'
import { renderHtmlToPdf } from '../services/PDFService'
import { logger } from '../utils/logger'

function timestampSlug(date: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0')
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '-',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join('')
}

function defaultFileName(target: string): string {
  const slug = target.replace(/[^a-zA-Z0-9.-]/g, '-').slice(0, 64)
  return `recon-${slug}-${timestampSlug(new Date())}.pdf`
}

export function registerReportIpc(): void {
  ipcMain.handle(
    IPC.ReportExportPdf,
    async (event: IpcMainInvokeEvent, payload: unknown): Promise<ExportPdfResponse> => {
      // The renderer is untrusted input from here, same as for a scan target.
      const parsed = exportPdfRequestSchema.safeParse(payload)
      if (!parsed.success) {
        return {
          ok: false,
          canceled: false,
          error: parsed.error.issues[0]?.message ?? 'Invalid report payload'
        }
      }

      // The envelope is validated above; per-module payloads keep their declared
      // shapes, and the template reads them defensively and escapes every value.
      const request: ExportPdfRequest = {
        ...parsed.data,
        results: parsed.data.results as unknown as ReconResult[]
      }

      const options: SaveDialogOptions = {
        title: 'Export recon report',
        defaultPath: join(app.getPath('documents'), defaultFileName(request.target)),
        filters: [{ name: 'PDF document', extensions: ['pdf'] }]
      }
      const parent = BrowserWindow.fromWebContents(event.sender)
      const saved = parent
        ? await dialog.showSaveDialog(parent, options)
        : await dialog.showSaveDialog(options)

      if (saved.canceled || !saved.filePath) {
        return { ok: false, canceled: true }
      }

      try {
        const pdf = await renderHtmlToPdf(buildReportHtml(request))
        await writeFile(saved.filePath, pdf)
        logger.info('report.ipc', `report written to ${saved.filePath}`)
        return { ok: true, filePath: saved.filePath }
      } catch (err) {
        logger.error('report.ipc', 'failed to generate report', err)
        return { ok: false, canceled: false, error: 'Could not generate the PDF report' }
      }
    }
  )
}
