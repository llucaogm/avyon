import { format, isSameDay } from 'date-fns'

const WEEKDAY_LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

export interface GridDay {
  date: string
  dayOfMonth: number
  weekdayLetter: string
  isToday: boolean
}

/** Dias 1..N do mês informado — o mês em si já fica no cabeçalho de
 * navegação (ver GradeTab), então cada coluna só precisa do dia e da letra
 * do dia da semana. */
export function buildMonthGridDays(year: number, month: number): GridDay[] {
  const today = new Date()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days: GridDay[] = []

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    days.push({
      date: format(date, 'yyyy-MM-dd'),
      dayOfMonth: d,
      weekdayLetter: WEEKDAY_LETTERS[date.getDay()],
      isToday: isSameDay(date, today),
    })
  }

  return days
}
