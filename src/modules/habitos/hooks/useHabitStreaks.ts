import { useMemo } from 'react'
import { format, subDays } from 'date-fns'
import type { Tables } from '@/shared/types/database.types'
import { HABIT_LOG_WINDOW_DAYS } from '@/modules/habitos/hooks/useHabitLogs'
import { isHabitScheduledOn } from '@/modules/habitos/lib/habitSchedule'

export interface HabitStreak {
  current: number
  longest: number
}

/** Scheduled dates for a habit, most recent first, within the log fetch window. */
function scheduledDatesDesc(habit: Tables<'habits'>): string[] {
  const dates: string[] = []
  const today = new Date()
  for (let i = 0; i < HABIT_LOG_WINDOW_DAYS; i++) {
    const d = subDays(today, i)
    if (isHabitScheduledOn(habit, d)) dates.push(format(d, 'yyyy-MM-dd'))
  }
  return dates
}

/** Current streak = consecutive scheduled days done, counting back from today —
 * stops (current freezes) at the first scheduled-but-not-done day. Longest is the
 * best run anywhere in the fetched window. Both derived client-side, never stored. */
function computeStreak(habit: Tables<'habits'>, doneDates: Set<string>): HabitStreak {
  let current = 0
  let longest = 0
  let running = 0
  let stillCounting = true

  for (const iso of scheduledDatesDesc(habit)) {
    if (doneDates.has(iso)) {
      running++
      longest = Math.max(longest, running)
      if (stillCounting) current = running
    } else {
      running = 0
      stillCounting = false
    }
  }

  return { current, longest }
}

export function useHabitStreaks(
  habits: Tables<'habits'>[],
  logs: Tables<'habit_logs'>[],
): Map<string, HabitStreak> {
  return useMemo(() => {
    const doneByHabit = new Map<string, Set<string>>()
    for (const log of logs) {
      if (!doneByHabit.has(log.habit_id)) doneByHabit.set(log.habit_id, new Set())
      doneByHabit.get(log.habit_id)!.add(log.data)
    }
    const streaks = new Map<string, HabitStreak>()
    for (const habit of habits) {
      streaks.set(habit.id, computeStreak(habit, doneByHabit.get(habit.id) ?? new Set()))
    }
    return streaks
  }, [habits, logs])
}
