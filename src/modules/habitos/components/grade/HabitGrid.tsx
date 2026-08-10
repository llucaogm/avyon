import { forwardRef } from 'react'
import { parseISO } from 'date-fns'
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
import { buildHabitGridWeeks } from '@/modules/habitos/lib/gridDates'
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
  const weeks = buildHabitGridWeeks()

  return (
    <div className="rounded-md border">
      <Table className="w-auto" containerRef={scrollRef}>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="bg-card sticky left-0 z-20 min-w-[160px]" />
            {weeks.map((week) => (
              <TableHead
                key={week.label}
                colSpan={week.days.length}
                className="text-center text-xs text-muted-foreground"
              >
                {week.label}
              </TableHead>
            ))}
          </TableRow>
          <TableRow className="hover:bg-transparent">
            <TableHead className="bg-card sticky left-0 z-20 min-w-[160px]" />
            {weeks.flatMap((week, wi) =>
              week.days.map((day, di) =>
                day ? (
                  <TableHead key={day.date} className="w-9 p-1 text-center">
                    {day.isToday ? (
                      <span className="bg-primary text-primary-foreground mx-auto flex size-6 items-center justify-center rounded-full text-xs">
                        {day.dayOfMonth}
                      </span>
                    ) : (
                      <span className="text-xs">{day.dayOfMonth}</span>
                    )}
                  </TableHead>
                ) : (
                  <TableHead key={`${wi}-${di}`} className="w-9 p-1" />
                ),
              ),
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {habits.map((habit) => {
            const Icon = getHabitIcon(habit.icone)
            const stat = stats.get(habit.id)
            const done = doneByHabit.get(habit.id)
            return (
              <TableRow key={habit.id}>
                <TableCell className="bg-card sticky left-0 z-10 border-r min-w-[160px]">
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
                {weeks.flatMap((week, wi) =>
                  week.days.map((day, di) => {
                    if (!day) return <TableCell key={`${wi}-${di}`} className="w-9 p-1" />

                    if (!isHabitScheduledOn(habit, parseISO(day.date))) {
                      return (
                        <TableCell key={day.date} className="w-9 p-1 text-center text-muted-foreground/30">
                          —
                        </TableCell>
                      )
                    }

                    const key = `${habit.id}:${day.date}`
                    const isDone = done?.has(day.date) ?? false

                    return (
                      <TableCell key={day.date} className="w-9 p-1 text-center">
                        <span className="flex items-center justify-center">
                          {justConfirmedCells.has(key) ? (
                            <ConfirmCheck color="var(--primary)" />
                          ) : (
                            <Checkbox
                              checked={isDone}
                              disabled={pendingCells.has(key)}
                              onCheckedChange={(checked) => onToggleCell(habit.id, day.date, !!checked)}
                              className="size-5"
                            />
                          )}
                        </span>
                      </TableCell>
                    )
                  }),
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
})
