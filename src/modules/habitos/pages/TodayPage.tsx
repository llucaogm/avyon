import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/shared/components/ui/card'
import { LoadingState } from '@/shared/components/common/LoadingState'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { useHabits } from '@/modules/habitos/hooks/useHabits'
import { useHabitLogs, useToggleHabitLog } from '@/modules/habitos/hooks/useHabitLogs'
import { useHabitStreaks } from '@/modules/habitos/hooks/useHabitStreaks'
import { HabitRow } from '@/modules/habitos/components/HabitRow'
import { isHabitScheduledOn } from '@/modules/habitos/lib/habitSchedule'
import { todayIso } from '@/modules/habitos/lib/dateUtils'
import { getErrorMessage } from '@/shared/lib/errors'

export default function TodayPage() {
  const { data: habits = [], isLoading: loadingHabits } = useHabits()
  const { data: logs = [], isLoading: loadingLogs } = useHabitLogs()
  const toggleLog = useToggleHabitLog()
  const streaks = useHabitStreaks(habits, logs)
  const [justConfirmed, setJustConfirmed] = useState<Set<string>>(new Set())
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const today = todayIso()
  const doneToday = useMemo(() => new Set(logs.filter((l) => l.data === today).map((l) => l.habit_id)), [logs, today])

  const todaysHabits = useMemo(
    () => habits.filter((h) => isHabitScheduledOn(h, new Date())),
    [habits],
  )

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
      { habitId, date: today, logged },
      {
        onSuccess: () => {
          if (logged) playConfirmMoment(habitId)
        },
        onError: (err) => toast.error(getErrorMessage(err, 'Não consegui salvar essa marcação')),
      },
    )
  }

  const isLoading = loadingHabits || loadingLogs

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold">Hoje</h1>

      {isLoading && <LoadingState />}

      {!isLoading && habits.length === 0 && (
        <EmptyState message="Nenhum hábito cadastrado ainda. Crie o primeiro em Gerenciar." />
      )}

      {!isLoading && habits.length > 0 && todaysHabits.length === 0 && (
        <EmptyState message="Nenhum hábito programado para hoje." />
      )}

      {todaysHabits.length > 0 && (
        <Card className="animate-fade-in-up">
          <CardContent className="flex flex-col divide-y p-0">
            {todaysHabits.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                isDoneToday={doneToday.has(habit.id)}
                streak={streaks.get(habit.id)?.current ?? 0}
                justConfirmed={justConfirmed.has(habit.id)}
                pending={toggleLog.isPending}
                onToggle={() => handleToggle(habit.id, !doneToday.has(habit.id))}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
