import { format } from 'date-fns'

export function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd')
}
