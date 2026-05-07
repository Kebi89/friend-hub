import Navbar from '@/components/Navbar'
import { cn } from '@/lib/utils'

export function PageShell({ children, className }) {
  return (
    <div className="min-h-screen bg-muted/40 text-foreground">
      <Navbar />
      <main className={cn('container mx-auto px-4 py-8 sm:py-10', className)}>
        {children}
      </main>
    </div>
  )
}

export function PageHeader({ icon: Icon, title, description, actions, className }) {
  return (
    <div className={cn('mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        <div className="mb-3 flex items-center gap-3">
          {Icon && (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <Icon className="h-5 w-5" />
            </span>
          )}
          <h1 className="text-3xl font-bold tracking-normal text-foreground sm:text-4xl">{title}</h1>
        </div>
        {description && <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function SectionCard({ children, className }) {
  return (
    <section className={cn('app-surface rounded-lg p-5 sm:p-6', className)}>
      {children}
    </section>
  )
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('app-surface rounded-lg px-5 py-12 text-center', className)}>
      {Icon && (
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
          <Icon className="h-7 w-7" />
        </div>
      )}
      <p className="text-lg font-semibold text-foreground">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
