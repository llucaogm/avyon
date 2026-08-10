import { format, isSameDay, subDays } from 'date-fns'
import { HABIT_LOG_WINDOW_DAYS } from '@/modules/habitos/hooks/useHabitLogs'

const WEEKDAY_LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MONTH_ABBREV = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez',
]

export interface GridDay {
  date: string
  dayOfMonth: number
  weekdayLetter: string
  monthLabel: string | null
  isToday: boolean
}

/**
 * Flat, oldest-to-newest day list for the habit grid — no week-block padding,
 * since the header no longer groups by calendar week (see HabitGrid). Each day
 * carries a weekday initial (rhythm — did I skip the weekend) and a month label
 * that's only set on the 1st of a month or the very first rendered day, so the
 * header can anchor the calendar without repeating a month name every column.
 */
export function buildHabitGridDays(windowDays = HABIT_LOG_WINDOW_DAYS): GridDay[] {
  const today = new Date()
  const days: GridDay[] = []

  for (let i = 0; i < windowDays; i++) {
    const d = subDays(today, windowDays - 1 - i)
    const dayOfMonth = d.getDate()
    days.push({
      date: format(d, 'yyyy-MM-dd'),
      dayOfMonth,
      weekdayLetter: WEEKDAY_LETTERS[d.getDay()],
      monthLabel: dayOfMonth === 1 || i === 0 ? MONTH_ABBREV[d.getMonth()] : null,
      isToday: isSameDay(d, today),
    })
  }

  return days
}
