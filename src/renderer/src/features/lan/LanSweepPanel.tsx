import { Loader2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { useLanStore } from '@renderer/stores/lan.store'

export function LanSweepPanel(): React.JSX.Element {
  const isSweeping = useLanStore((s) => s.isSweeping)
  const error = useLanStore((s) => s.error)
  const startSweep = useLanStore((s) => s.startSweep)
  const cancelSweep = useLanStore((s) => s.cancelSweep)

  return (
    <div className="border-b border-border px-6 py-4">
      <div className="flex items-start gap-3">
        <Button type="button" disabled={isSweeping} onClick={() => void startSweep()}>
          {isSweeping && <Loader2 className="animate-spin" />}
          Start Sweep
        </Button>
        <Button type="button" variant="outline" disabled={!isSweeping} onClick={cancelSweep}>
          Cancel
        </Button>
      </div>
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  )
}
