import { format, subDays } from 'date-fns'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabaseClient'
import { useAuth } from '@/shared/context/AuthProvider'
import { requireUser } from '@/shared/lib/errors'
import { HABIT_LOG_WINDOW_DAYS } from '@/modules/habitos/hooks/useHabitLogs'

export function usePesoLogs(days = HABIT_LOG_WINDOW_DAYS) {
  const { user } = useAuth()
  const since = format(subDays(new Date(), days), 'yyyy-MM-dd')

  return useQuery({
    queryKey: ['peso_logs', user?.id, since],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('peso_logs')
        .select('*')
        .gte('data', since)
        .order('data', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useAddPesoLog() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ peso_kg, data }: { peso_kg: number; data: string }) => {
      requireUser(user)
      const { error } = await supabase.from('peso_logs').insert({ peso_kg, data, user_id: user.id })
      if (error) throw error
    },
    meta: { action: 'peso_log.add' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['peso_logs', user?.id] }),
  })
}

export function useDeletePesoLog() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('peso_logs').delete().eq('id', id)
      if (error) throw error
    },
    meta: { action: 'peso_log.delete' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['peso_logs', user?.id] }),
  })
}
