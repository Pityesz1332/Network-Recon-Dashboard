import { FileDown, Loader2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { useScanStore } from '@renderer/stores/scan.store'

export function ScanPanel(): React.JSX.Element {
  const target = useScanStore((s) => s.target)
  const validationError = useScanStore((s) => s.validationError)
  const isScanning = useScanStore((s) => s.isScanning)
  const isExporting = useScanStore((s) => s.isExporting)
  const exportError = useScanStore((s) => s.exportError)
  const exportedPath = useScanStore((s) => s.exportedPath)
  const hasResults = useScanStore((s) =>
    Object.values(s.results).some((r) => r.status === 'success' || r.status === 'error')
  )
  const setTarget = useScanStore((s) => s.setTarget)
  const startScan = useScanStore((s) => s.startScan)
  const cancelScan = useScanStore((s) => s.cancelScan)
  const exportPdf = useScanStore((s) => s.exportPdf)

  const canScan = target.trim().length > 0 && !validationError && !isScanning
  const canExport = hasResults && !isScanning && !isExporting

  return (
    <div className="border-b border-border/60 bg-card/20 px-6 py-4 backdrop-blur-sm">
      <form
        className="flex items-start gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (canScan) void startScan()
        }}
      >
        <div className="flex-1">
          <Input
            placeholder="IPv4 address or hostname (e.g. 192.168.1.1 or example.com)"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            aria-invalid={validationError ? true : undefined}
            disabled={isScanning}
          />
          {validationError && <p className="mt-1.5 text-xs text-destructive">{validationError}</p>}
        </div>
        <Button type="submit" disabled={!canScan}>
          {isScanning && <Loader2 className="animate-spin" />}
          Scan
        </Button>
        <Button type="button" variant="outline" disabled={!isScanning} onClick={cancelScan}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!canExport}
          onClick={() => void exportPdf()}
        >
          {isExporting ? <Loader2 className="animate-spin" /> : <FileDown />}
          Export PDF
        </Button>
      </form>

      {exportError && <p className="mt-2 text-xs text-destructive">{exportError}</p>}
      {exportedPath && (
        <p className="mt-2 truncate text-xs text-muted-foreground" title={exportedPath}>
          Report saved to {exportedPath}
        </p>
      )}
    </div>
  )
}
