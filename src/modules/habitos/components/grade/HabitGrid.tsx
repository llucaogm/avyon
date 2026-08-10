import { forwardRef } from 'react'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { ConfirmCheck } from '@/shared/components/common/ConfirmCheck'
import { getHabitIcon } from '@/modules/habitos/lib/habitIcons'
import { isHabitScheduledOn } from '@/modules/habitos/lib/habitSchedule'
import { buildHabitGridDays } from '@/modules/habitos/lib/gridDates'
import { cn } from '@/shared/lib/utils'
import type { HabitStat } from '@/modules/habitos/hooks/useHabitStats'
import type { Tables } from '@/shared/types/database.types'

interface HabitGridProps {
  habits: Tables<'habits'>[]
  doneByHabit: Map<string, Set<string>>
  stats: Map<string, HabitStat>
  pendingCells: Set<string>
  justConfirmedCells: Set<string>
  onToggleCell: (habitId: string, date: string, logged: boolean) => void
  onEditHabit: (habit: Tables<'habits'>) => void
  onDeleteHabit: (habitId: string) => void
}

export const HabitGrid = forwardRef<HTMLDivElement, HabitGridProps>(function HabitGrid(
  { habits, doneByHabit, stats, pendingCells, justConfirmedCells, onToggleCell, onEditHabit, onDeleteHabit },
  scrollRef,
) {
  const days = buildHabitGridDays()

  return (
    <div className="rounded-md border">
      <Table className="w-auto" containerRef={scrollRef}>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="bg-card sticky left-0 z-20 min-w-[180px]" />
            {days.map((day) => (
              <TableHead
                key={day.date}
                className={cn('w-11 p-1 text-center align-bottom', day.isToday && 'bg-primary/10')}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span className="h-3 text-[9px] leading-none text-muted-foreground">
                    {day.monthLabel ?? ''}
                  </span>
                  <span className="text-[10px] leading-none text-muted-foreground">{day.weekdayLetter}</span>
                  <span className={cn('text-xs leading-none', day.isToday && 'text-primary font-semibold')}>
                    {day.dayOfMonth}
                  </span>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {habits.map((habit) => {
            const Icon = getHabitIcon(habit.icone)
            const stat = stats.get(habit.id)
            const done = doneByHabit.get(habit.id)
            return (
              <TableRow key={habit.id}>
                <TableCell className="bg-card sticky left-0 z-10 min-w-[180px] border-r">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{habit.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round((stat?.percent ?? 0) * 100)}%
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label={`Opções de ${habit.nome}`}
                          className="press-feedback text-muted-foreground shrink-0"
                        >
                          <MoreVertical className="size-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditHabit(habit)}>
                          <Pencil className="size-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDeleteHabit(habit.id)}>
                          <Trash2 className="size-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
                {days.map((day) => {
                  if (!isHabitScheduledOn(habit, new Date(`${day.date}T00:00:00`))) {
                    return (
                      <TableCell
                        key={day.date}
                        className={cn('w-11 p-1 text-center', day.isToday && 'bg-primary/10')}
                      >
                        <span className="text-muted-foreground/25">·</span>
                      </TableCell>
                    )
                  }

                  const key = `${habit.id}:${day.date}`
                  const isDone = done?.has(day.date) ?? false

                  return (
                    <TableCell
                      key={day.date}
                      className={cn('w-11 p-1 text-center', day.isToday && 'bg-primary/10')}
                      title={day.date}
                    >
                      <span className="flex items-center justify-center">
                        {justConfirmedCells.has(key) ? (
                          <ConfirmCheck color="var(--primary)" />
                        ) : (
                          <Checkbox
                            checked={isDone}
                            disabled={pendingCells.has(key)}
                            onCheckedChange={(checked) => onToggleCell(habit.id, day.date, !!checked)}
                            className="border-border data-checked:border-primary size-8 rounded-lg border-2 [&>svg]:size-4"
                          />
                        )}
                      </span>
                    </TableCell>
                  )
                })}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
})
