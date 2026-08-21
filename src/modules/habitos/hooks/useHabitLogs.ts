import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabaseClient'
import { useAuth } from '@/shared/context/AuthProvider'
import { requireUser } from '@/shared/lib/errors'

export const HABIT_LOG_WINDOW_DAYS = 90

/** Janela fixa de 90 dias, independente do mês que a grade está mostrando —
 * usada só pra calcular sequência/porcentagem (useHabitStats), que precisa
 * sempre olhar pro presente, não pro mês que o usuário está navegando. */
export function useHabitLogs() {
  const { user } = useAuth()
  const since = format(subDays(new Date(), HABIT_LOG_WINDOW_DAYS), 'yyyy-MM-dd')

  return useQuery({
    queryKey: ['habit_logs', user?.id, since],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .gte('data', since)
        .order('data', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

/** Logs só do mês exibido na grade — separado da janela fixa acima porque
 * navegar pra um mês fora dos últimos 90 dias precisa continuar funcionando. */
export function useHabitLogsForMonth(monthDate: Date) {
  const { user } = useAuth()
  const start = format(startOfMonth(monthDate), 'yyyy-MM-dd')
  const end = format(endOfMonth(monthDate), 'yyyy-MM-dd')

  return useQuery({
    queryKey: ['habit_logs', user?.id, 'month', start],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .gte('data', start)
        .lte('data', end)
        .order('data', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function useToggleHabitLog() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ habitId, date, logged }: { habitId: string; date: string; logged: boolean }) => {
      requireUser(user)
      if (logged) {
        const { error } = await supabase
          .from('habit_logs')
          .insert({ habit_id: habitId, data: date, user_id: user.id })
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('habit_logs')
          .delete()
          .eq('habit_id', habitId)
          .eq('data', date)
        if (error) throw error
      }
    },
    meta: { action: 'habit_log.toggle' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habit_logs', user?.id] }),
  })
}
