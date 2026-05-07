import { Wand2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function EffectPresetCard({ preset, selected = false, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(preset)}
      className={cn(
        'interactive-lift flex h-full w-full flex-col items-start rounded-lg border bg-white p-4 text-left',
        selected
          ? 'border-primary shadow-lift ring-2 ring-primary/20'
          : 'border-border hover:border-primary/40'
      )}
    >
      <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
        <Wand2 className="h-4 w-4" />
      </span>
      <span className="text-sm font-semibold text-foreground">{preset.name}</span>
      <span className="mt-1 min-h-10 text-sm leading-5 text-muted-foreground">
        {preset.description}
      </span>
      <div className="mt-4 flex flex-wrap gap-2">
        {preset.tags.map((tag) => (
          <Badge key={tag} variant="muted">
            {tag}
          </Badge>
        ))}
      </div>
    </button>
  )
}
