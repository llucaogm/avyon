import { useEffect, useMemo, useRef, useState } from 'react'
import { Settings } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { Progress } from '@/shared/components/ui/progress'
import { LoadingState } from '@/shared/components/common/LoadingState'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { useHabits, useDeactivateHabit } from '@/modules/habitos/hooks/useHabits'
import { useHabitLogs, useToggleHabitLog } from '@/modules/habitos/hooks/useHabitLogs'
import { useHabitStats } from '@/modules/habitos/hooks/useHabitStats'
import { HabitGrid } from '@/modules/habitos/components/grade/HabitGrid'
import { HabitsManageSheet } from '@/modules/habitos/components/grade/HabitsManageSheet'
import { HabitFormDialog } from '@/modules/habitos/components/HabitFormDialog'
import { isHabitScheduledOn } from '@/modules/habitos/lib/habitSchedule'
import { todayIso } from '@/modules/habitos/lib/dateUtils'
import { getErrorMessage } from '@/shared/lib/errors'
import type { Tables } from '@/shared/types/database.types'

const MILESTONES = [7, 30, 100]

export function GradeTab() {
  const { data: habits = [], isLoading: loadingHabits } = useHabits()
  const { data: logs = [], isLoading: loadingLogs } = useHabitLogs()
  const toggleLog = useToggleHabitLog()
  const deactivateHabit = useDeactivateHabit()
  const stats = useHabitStats(habits, logs)

  const [justConfirmedCells, setJustConfirmedCells] = useState<Set<string>>(new Set())
  const [pendingCells, setPendingCells] = useState<Set<string>>(new Set())
  const [manageOpen, setManageOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Tables<'habits'> | undefined>()
  const [formOpen, setFormOpen] = useState(false)
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const scrollRef = useRef<HTMLDivElement>(null)

  const doneByHabit = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const log of logs) {
      if (!map.has(log.habit_id)) map.set(log.habit_id, new Set())
      map.get(log.habit_id)!.add(log.data)
    }
    return map
  }, [logs])

  const today = todayIso()
  const todaysHabits = useMemo(() => habits.filter((h) => isHabitScheduledOn(h, new Date())), [habits])
  const doneToday = useMemo(
    () => todaysHabits.filter((h) => doneByHabit.get(h.id)?.has(today)).length,
    [todaysHabits, doneByHabit, today],
  )
  const progresso = todaysHabits.length > 0 ? doneToday / todaysHabits.length : 0

  const isLoading = loadingHabits || loadingLogs

  // Open already scrolled to today — the window always ends today, so without this
  // the grid would start showing the oldest (least relevant) days. Depends on the
  // combined isLoading (not just loadingLogs) so it fires once the grid has actually
  // mounted, regardless of which of the two queries happens to settle last.
  useEffect(() => {
    if (!isLoading && scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [isLoading])

  function playConfirmMoment(key: string) {
    setJustConfirmedCells((prev) => new Set(prev).add(key))
    const existing = timers.current.get(key)
    if (existing) clearTimeout(existing)
    timers.current.set(
      key,
      setTimeout(() => {
        setJustConfirmedCells((prev) => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      }, 900),
    )
  }

  function handleToggleCell(habitId: string, date: string, logged: boolean) {
    const key = `${habitId}:${date}`
    setPendingCells((prev) => new Set(prev).add(key))
    toggleLog.mutate(
      { habitId, date, logged },
      {
        onSuccess: () => {
          if (!logged) return
          playConfirmMoment(key)
          if (date !== today) return
          const current = stats.get(habitId)?.current ?? 0
          const newStreak = current + 1
          if (MILESTONES.includes(newStreak)) {
            const habitNome = habits.find((h) => h.id === habitId)?.nome ?? 'hábito'
            toast.success(`${newStreak} dias seguidos em ${habitNome}! 🔥`)
          }
        },
        onError: (err) => toast.error(getErrorMessage(err, 'Não consegui salvar essa marcação')),
        onSettled: () => {
          setPendingCells((prev) => {
            const next = new Set(prev)
            next.delete(key)
            return next
          })
        },
      },
    )
  }

  function handleEditHabit(habit: Tables<'habits'>) {
    setEditingHabit(habit)
    setFormOpen(true)
  }

  function handleDeleteHabit(habitId: string) {
    deactivateHabit.mutate(habitId, {
      onError: () => toast.error('Não consegui excluir esse hábito'),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {todaysHabits.length > 0
                ? `${doneToday}/${todaysHabits.length} hábitos hoje`
                : 'Nenhum hábito programado para hoje'}
            </span>
          </div>
          {todaysHabits.length > 0 && <Progress value={progresso * 100} className="mt-1.5" />}
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

      {!isLoading && habits.length > 0 && (
        <HabitGrid
          ref={scrollRef}
          habits={habits}
          doneByHabit={doneByHabit}
          stats={stats}
          pendingCells={pendingCells}
          justConfirmedCells={justConfirmedCells}
          onToggleCell={handleToggleCell}
          onEditHabit={handleEditHabit}
          onDeleteHabit={handleDeleteHabit}
        />
      )}

      <HabitsManageSheet open={manageOpen} onOpenChange={setManageOpen} />
      <HabitFormDialog open={formOpen} onOpenChange={setFormOpen} habit={editingHabit} />
    </div>
  )
}
