import {
  addMonths,
  endOfMonth,
  format,
  isWithinInterval,
  startOfMonth,
} from 'date-fns'

/** First-of-month ISO date (YYYY-MM-DD) used as the canonical key for a given month. */
export function monthKey(date: Date): string {
  return format(startOfMonth(date), 'yyyy-MM-dd')
}

export function monthRange(date: Date): { start: Date; end: Date } {
  return { start: startOfMonth(date), end: endOfMonth(date) }
}

export function isInMonth(isoDate: string, monthDate: Date): boolean {
  const [y, m, d] = isoDate.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  const { start, end } = monthRange(monthDate)
  return isWithinInterval(target, { start, end })
}

export function shiftMonth(date: Date, amount: number): Date {
  return addMonths(date, amount)
}

export function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd')
}
