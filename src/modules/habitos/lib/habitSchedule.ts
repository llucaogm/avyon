import type { Tables } from '@/shared/types/database.types'

export function isHabitScheduledOn(habit: Tables<'habits'>, date: Date): boolean {
  if (habit.frequencia_tipo === 'diaria') return true
  return (habit.dias_semana ?? []).includes(date.getDay())
}
