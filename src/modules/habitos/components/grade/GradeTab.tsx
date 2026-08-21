import { useMemo, useRef, useState } from 'react'
import { Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { Progress } from '@/shared/components/ui/progress'
import { LoadingState } from '@/shared/components/common/LoadingState'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { useHabits, useDeactivateHabit } from '@/modules/habitos/hooks/useHabits'
import { useHabitLogs, useHabitLogsForMonth, useToggleHabitLog } from '@/modules/habitos/hooks/useHabitLogs'
import { useHabitStats } from '@/modules/habitos/hooks/useHabitStats'
import { HabitGrid } from '@/modules/habitos/components/grade/HabitGrid'
import { HabitsManageSheet } from '@/modules/habitos/components/grade/HabitsManageSheet'
import { HabitFormDialog } from '@/modules/habitos/components/HabitFormDialog'
import { isHabitScheduledOn } from '@/modules/habitos/lib/habitSchedule'
import { buildMonthGridDays } from '@/modules/habitos/lib/gridDates'
import { todayIso } from '@/modules/habitos/lib/dateUtils'
import { getErrorMessage } from '@/shared/lib/errors'
import { formatMonthLabel } from '@/shared/lib/formatters'
import type { Tables } from '@/shared/types/database.types'

const MILESTONES = [7, 30, 100]

export function GradeTab() {
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth()

  const { data: habits = [], isLoading: loadingHabits } = useHabits()
  // Janela fixa de 90 dias pra sequência/porcentagem (sempre relativa a hoje),
  // separada dos logs do mês em exibição (que podem estar fora dessa janela).
  const { data: statsLogs = [], isLoading: loadingStatsLogs } = useHabitLogs()
  const { data: monthLogs = [], isLoading: loadingMonthLogs } = useHabitLogsForMonth(
    new Date(viewYear, viewMonth, 1),
  )
  const toggleLog = useToggleHabitLog()
  const deactivateHabit = useDeactivateHabit()
  const stats = useHabitStats(habits, statsLogs)

  const [justConfirmedCells, setJustConfirmedCells] = useState<Set<string>>(new Set())
  const [pendingCells, setPendingCells] = useState<Set<string>>(new Set())
  const [manageOpen, setManageOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Tables<'habits'> | undefined>()
  const [formOpen, setFormOpen] = useState(false)
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const days = useMemo(() => buildMonthGridDays(viewYear, viewMonth), [viewYear, viewMonth])

  const doneByHabit = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const log of monthLogs) {
      if (!map.has(log.habit_id)) map.set(log.habit_id, new Set())
      map.get(log.habit_id)!.add(log.data)
    }
    return map
  }, [monthLogs])

  // % exibida no cabeçalho da grade — precisa ser sobre os dias DESSE mês (o
  // que está na tela), não sobre a janela fixa de 90 dias usada pra sequência.
  // Dias futuros dentro do mês (se for o mês atual) não contam contra a %.
  const monthStats = useMemo(() => {
    const map = new Map<string, { percent: number }>()
    const todayStr = todayIso()
    for (const habit of habits) {
      const doneDates = doneByHabit.get(habit.id)
      let doneCount = 0
      let totalScheduled = 0
      for (const day of days) {
        if (day.date > todayStr) continue
        if (!isHabitScheduledOn(habit, new Date(`${day.date}T00:00:00`))) continue
        totalScheduled++
        if (doneDates?.has(day.date)) doneCount++
      }
      map.set(habit.id, { percent: totalScheduled > 0 ? doneCount / totalScheduled : 0 })
    }
    return map
  }, [habits, doneByHabit, days])

  function changeMonth(delta: number) {
    let m = viewMonth + delta
    let y = viewYear
    if (m < 0) {
      m = 11
      y -= 1
    } else if (m > 11) {
      m = 0
      y += 1
    }
    setViewMonth(m)
    setViewYear(y)
  }

  const today = todayIso()
  const todaysHabits = useMemo(() => habits.filter((h) => isHabitScheduledOn(h, new Date())), [habits])
  // Vem da janela fixa (statsLogs), não da grade — "hábitos hoje" precisa continuar
  // certo mesmo navegando pra um mês diferente do atual, que não tem o log de hoje.
  const doneTodaySet = useMemo(
    () => new Set(statsLogs.filter((l) => l.data === today).map((l) => l.habit_id)),
    [statsLogs, today],
  )
  const doneToday = useMemo(
    () => todaysHabits.filter((h) => doneTodaySet.has(h.id)).length,
    [todaysHabits, doneTodaySet],
  )
  const progresso = todaysHabits.length > 0 ? doneToday / todaysHabits.length : 0

  const isLoading = loadingHabits || loadingStatsLogs || loadingMonthLogs

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

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon-sm" onClick={() => changeMonth(-1)} aria-label="Mês anterior">
          <ChevronLeft className="size-4" />
        </Button>
        <span className="font-display text-sm font-semibold">
          {formatMonthLabel(new Date(viewYear, viewMonth, 1))}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => changeMonth(1)}
          disabled={isCurrentMonth}
          aria-label="Próximo mês"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {isLoading && <LoadingState />}

      {!isLoading && habits.length === 0 && (
        <EmptyState message="Nenhum hábito cadastrado ainda. Toque em Gerenciar pra criar o primeiro." />
      )}

      {!isLoading && habits.length > 0 && (
        <HabitGrid
          days={days}
          habits={habits}
          doneByHabit={doneByHabit}
          stats={monthStats}
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
