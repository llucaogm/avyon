import { Flame } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'

export function StreakBadge({ streak }: { streak: number }) {
  if (streak <= 0) return null

  return (
    <Badge variant="secondary" className="gap-1">
      <Flame className="size-3" />
      {streak}
    </Badge>
  )
}
