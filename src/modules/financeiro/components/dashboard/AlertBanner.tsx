import { AlertTriangle } from 'lucide-react'

export function AlertBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
      <AlertTriangle className="size-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
