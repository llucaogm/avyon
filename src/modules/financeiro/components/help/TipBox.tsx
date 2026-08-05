import type { ReactNode } from 'react'
import { Lightbulb } from 'lucide-react'

export function TipBox({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200">
      <Lightbulb className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  )
}

export function ExampleBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed bg-muted/40 p-3 text-sm">
      <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">Exemplo</p>
      {children}
    </div>
  )
}
