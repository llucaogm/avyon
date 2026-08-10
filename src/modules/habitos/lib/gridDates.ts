import { format, isSameDay, subDays } from 'date-fns'
import { HABIT_LOG_WINDOW_DAYS } from '@/modules/habitos/hooks/useHabitLogs'

export interface GridDay {
  date: string
  dayOfMonth: number
  isToday: boolean
}

export interface GridWeek {
  label: string
  days: (GridDay | null)[]
}

/**
 * Builds the habit grid's columns: `windowDays` back from today, oldest first,
 * left-padded with nulls to the previous Sunday (same domingo=0 convention as
 * isHabitScheduledOn) so weeks group cleanly into 7-day blocks. colSpan for each
 * week's header label is always `week.days.length`, so a partial first/last week
 * never desyncs the header from the body.
 */
export function buildHabitGridWeeks(windowDays = HABIT_LOG_WINDOW_DAYS): GridWeek[] {
  const today = new Date()
  const start = subDays(today, windowDays - 1)

  const days: GridDay[] = []
  for (let i = 0; i < windowDays; i++) {
    const d = subDays(today, windowDays - 1 - i)
    days.push({
      date: format(d, 'yyyy-MM-dd'),
      dayOfMonth: d.getDate(),
      isToday: isSameDay(d, today),
    })
  }

  const padded: (GridDay | null)[] = [...Array(start.getDay()).fill(null), ...days]

  const weeks: GridWeek[] = []
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push({ label: `S${weeks.length + 1}`, days: padded.slice(i, i + 7) })
  }

  return weeks
}
