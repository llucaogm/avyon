import { format, isSameDay, subDays } from 'date-fns'

export function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

const weekdayFormatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })

/** "Hoje" / "Ontem" for the two most common cases, otherwise a short weekday + date. */
export function formatDayLabel(date: Date): string {
  const today = new Date()
  if (isSameDay(date, today)) return 'Hoje'
  if (isSameDay(date, subDays(today, 1))) return 'Ontem'
  const label = weekdayFormatter.format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}
