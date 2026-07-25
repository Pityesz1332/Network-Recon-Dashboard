import { Network, Radar, Target } from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import { useViewStore, type ViewMode } from '@renderer/stores/view.store'

const MODES: Array<{ value: ViewMode; label: string; icon: typeof Target }> = [
  { value: 'wan', label: 'Single Target', icon: Target },
  { value: 'lan', label: 'Network Discovery', icon: Network }
]

export function TopBar(): React.JSX.Element {
  const mode = useViewStore((s) => s.mode)
  const setMode = useViewStore((s) => s.setMode)

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 bg-background/80 px-6 backdrop-blur-sm">
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Radar className="size-4" />
        </div>
        <h1 className="text-sm font-semibold tracking-tight text-foreground">
          Network Recon Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 p-1">
        {MODES.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              mode === value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>
    </header>
  )
}
