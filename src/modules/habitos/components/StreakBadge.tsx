import { Flame, Trophy } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'

export function StreakBadge({ streak, longest }: { streak: number; longest?: number }) {
  if (streak <= 0 && !longest) return null

  return (
    <span className="flex items-center gap-1">
      {streak > 0 && (
        <Badge variant="secondary" className="gap-1">
          <Flame className="size-3" />
          {streak}
        </Badge>
      )}
      {longest !== undefined && longest > streak && (
        <Badge variant="outline" className="gap-1 text-muted-foreground">
          <Trophy className="size-3" />
          {longest}
        </Badge>
      )}
    </span>
  )
}
