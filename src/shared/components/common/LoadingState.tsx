import { Card, CardContent } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/common/Skeleton'

/** Was a plain "Carregando..." string on every page — now a content-shaped
 * shimmer so the layout doesn't jump once the real cards arrive. */
export function LoadingState({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-label="Carregando" role="status">
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-5 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
