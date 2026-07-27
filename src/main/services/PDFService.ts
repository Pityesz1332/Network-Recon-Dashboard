import { BrowserWindow } from 'electron'

const FOOTER_TEMPLATE = `
  <div style="width:100%;padding:0 14mm;font-size:8px;color:#6b6b76;
              font-family:-apple-system,'Segoe UI',Roboto,sans-serif;
              display:flex;justify-content:space-between;">
    <span>Network Recon Dashboard</span>
    <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
  </div>`

// Rendering goes through Chromium's own print pipeline: the report HTML is loaded
// into an offscreen window that can neither run scripts nor reach the network,
// then printed to PDF. Text stays selectable and the layout is pure CSS.
export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      // The report is static markup — no scripts need to run to lay it out.
      javascript: false,
      webSecurity: true
    }
  })

  try {
    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
    return await win.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true,
      margins: { top: 0.55, bottom: 0.55, left: 0.5, right: 0.5 },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: FOOTER_TEMPLATE
    })
  } finally {
    win.destroy()
  }
}
