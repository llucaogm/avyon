import { useMemo, useRef, useState } from 'react'
import { addDays, format, isSameDay, subDays } from 'date-fns'
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Progress } from '@/shared/components/ui/progress'
import { LoadingState } from '@/shared/components/common/LoadingState'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { useHabits } from '@/modules/habitos/hooks/useHabits'
import { useHabitLogs, useToggleHabitLog, HABIT_LOG_WINDOW_DAYS } from '@/modules/habitos/hooks/useHabitLogs'
import { useHabitStreaks } from '@/modules/habitos/hooks/useHabitStreaks'
import { HabitRow } from '@/modules/habitos/components/HabitRow'
import { HabitsManageSheet } from '@/modules/habitos/components/hoje/HabitsManageSheet'
import { isHabitScheduledOn } from '@/modules/habitos/lib/habitSchedule'
import { formatDayLabel } from '@/modules/habitos/lib/dateUtils'
import { getErrorMessage } from '@/shared/lib/errors'

const MILESTONES = [7, 30, 100]

export function HojeTab() {
  const { data: habits = [], isLoading: loadingHabits } = useHabits()
  const { data: logs = [], isLoading: loadingLogs } = useHabitLogs()
  const toggleLog = useToggleHabitLog()
  const streaks = useHabitStreaks(habits, logs)
  const [justConfirmed, setJustConfirmed] = useState<Set<string>>(new Set())
  const [manageOpen, setManageOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const selectedIso = format(selectedDate, 'yyyy-MM-dd')
  const isViewingToday = isSameDay(selectedDate, new Date())
  const oldestEditable = subDays(new Date(), HABIT_LOG_WINDOW_DAYS - 1)
  const canGoBack = selectedDate > oldestEditable

  const doneOnDate = useMemo(
    () => new Set(logs.filter((l) => l.data === selectedIso).map((l) => l.habit_id)),
    [logs, selectedIso],
  )

  const habitsForDate = useMemo(
    () => habits.filter((h) => isHabitScheduledOn(h, selectedDate)),
    [habits, selectedDate],
  )

  const progresso = habitsForDate.length > 0 ? doneOnDate.size / habitsForDate.length : 0

  function playConfirmMoment(habitId: string) {
    setJustConfirmed((prev) => new Set(prev).add(habitId))
    const existing = timers.current.get(habitId)
    if (existing) clearTimeout(existing)
    timers.current.set(
      habitId,
      setTimeout(() => {
        setJustConfirmed((prev) => {
          const next = new Set(prev)
          next.delete(habitId)
          return next
        })
      }, 900),
    )
  }

  function handleToggle(habitId: string, logged: boolean) {
    toggleLog.mutate(
      { habitId, date: selectedIso, logged },
      {
        onSuccess: () => {
          if (!logged) return
          playConfirmMoment(habitId)
          if (!isViewingToday) return
          const current = streaks.get(habitId)?.current ?? 0
          const newStreak = current + 1
          if (MILESTONES.includes(newStreak)) {
            const habitNome = habits.find((h) => h.id === habitId)?.nome ?? 'hábito'
            toast.success(`${newStreak} dias seguidos em ${habitNome}! 🔥`)
          }
        },
        onError: (err) => toast.error(getErrorMessage(err, 'Não consegui salvar essa marcação')),
      },
    )
  }

  const isLoading = loadingHabits || loadingLogs

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          disabled={!canGoBack}
          onClick={() => setSelectedDate((d) => subDays(d, 1))}
          aria-label="Dia anterior"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="min-w-[11ch] text-center text-sm font-medium">{formatDayLabel(selectedDate)}</span>
        <Button
          variant="ghost"
          size="icon"
          disabled={isViewingToday}
          onClick={() => setSelectedDate((d) => addDays(d, 1))}
          aria-label="Próximo dia"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {habitsForDate.length > 0
                ? `${doneOnDate.size}/${habitsForDate.length} hábitos`
                : 'Nenhum hábito programado'}
            </span>
          </div>
          {habitsForDate.length > 0 && <Progress value={progresso * 100} className="mt-1.5" />}
        </div>
        <Button variant="outline" size="sm" onClick={() => setManageOpen(true)}>
          <Settings className="size-4" />
          Gerenciar
        </Button>
      </div>

      {isLoading && <LoadingState />}

      {!isLoading && habits.length === 0 && (
        <EmptyState message="Nenhum hábito cadastrado ainda. Toque em Gerenciar pra criar o primeiro." />
      )}

      {!isLoading && habits.length > 0 && habitsForDate.length === 0 && (
        <EmptyState message="Nenhum hábito programado para este dia." />
      )}

      {habitsForDate.length > 0 && (
        <Card className="animate-fade-in-up">
          <CardContent className="flex flex-col divide-y p-0">
            {habitsForDate.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                isDone={doneOnDate.has(habit.id)}
                streak={streaks.get(habit.id)?.current ?? 0}
                longestStreak={streaks.get(habit.id)?.longest ?? 0}
                justConfirmed={justConfirmed.has(habit.id)}
                pending={toggleLog.isPending}
                onToggle={() => handleToggle(habit.id, !doneOnDate.has(habit.id))}
              />
            ))}
          </CardContent>
        </Card>
      )}

      <HabitsManageSheet open={manageOpen} onOpenChange={setManageOpen} />
    </div>
  )
}
