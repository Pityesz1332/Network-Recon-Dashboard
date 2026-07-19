import { ToggleGroup, ToggleGroupItem } from '@renderer/components/ui/toggle-group'
import { useViewStore } from '@renderer/stores/view.store'

export function TopBar(): React.JSX.Element {
  const mode = useViewStore((s) => s.mode)
  const setMode = useViewStore((s) => s.setMode)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6">
      <h1 className="text-sm font-semibold tracking-wide text-foreground">
        Network Recon Dashboard
      </h1>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={mode}
        onValueChange={(value) => {
          if (value === 'lan' || value === 'wan') setMode(value)
        }}
      >
        <ToggleGroupItem value="lan">LAN</ToggleGroupItem>
        <ToggleGroupItem value="wan">WAN</ToggleGroupItem>
      </ToggleGroup>
    </header>
  )
}
