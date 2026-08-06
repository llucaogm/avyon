import type { CSSProperties } from 'react'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { ConfirmCheck } from '@/shared/components/common/ConfirmCheck'
import { getHabitIcon } from '@/modules/habitos/lib/habitIcons'
import { StreakBadge } from '@/modules/habitos/components/StreakBadge'
import type { Tables } from '@/shared/types/database.types'

interface HabitRowProps {
  habit: Tables<'habits'>
  isDone: boolean
  streak: number
  longestStreak: number
  justConfirmed: boolean
  pending: boolean
  onToggle: () => void
}

export function HabitRow({
  habit,
  isDone,
  streak,
  longestStreak,
  justConfirmed,
  pending,
  onToggle,
}: HabitRowProps) {
  const Icon = getHabitIcon(habit.icone)

  return (
    <div
      className={justConfirmed ? 'animate-wash flex items-center gap-3 p-3' : 'flex items-center gap-3 p-3'}
      style={{ '--wash-color': 'var(--primary)' } as CSSProperties}
    >
      <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
        <Icon className="size-4" />
      </span>
      <div className="flex flex-1 items-center gap-2">
        <span className="text-sm font-medium">{habit.nome}</span>
        <StreakBadge streak={streak} longest={longestStreak} />
      </div>
      {justConfirmed ? (
        <ConfirmCheck color="var(--primary)" />
      ) : (
        <Checkbox
          checked={isDone}
          disabled={pending}
          onCheckedChange={onToggle}
          className="size-6"
        />
      )}
    </div>
  )
}
