import { format, subDays } from 'date-fns'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabaseClient'
import { useAuth } from '@/shared/context/AuthProvider'
import { requireUser } from '@/shared/lib/errors'
import { todayIso } from '@/modules/habitos/lib/dateUtils'
import { HABIT_LOG_WINDOW_DAYS } from '@/modules/habitos/hooks/useHabitLogs'
import type { TablesUpdate } from '@/shared/types/database.types'

export function useAguaLogs(days = HABIT_LOG_WINDOW_DAYS) {
  const { user } = useAuth()
  const since = format(subDays(new Date(), days), 'yyyy-MM-dd')

  return useQuery({
    queryKey: ['agua_logs', user?.id, since],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agua_logs')
        .select('*')
        .gte('data', since)
        .order('data', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useAddAguaLog() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ml: number) => {
      requireUser(user)
      const { error } = await supabase.from('agua_logs').insert({ ml, data: todayIso(), user_id: user.id })
      if (error) throw error
    },
    meta: { action: 'agua_log.add' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agua_logs', user?.id] }),
  })
}

/** Singleton per user, seeded by the handle_new_user() trigger — same pattern
 * as app_settings/emergency_fund_config in the Financeiro module. */
export function useAguaConfig() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['habitos_config', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('habitos_config').select('*').single()
      if (error) throw error
      return data
    },
  })
}

export function useUpdateAguaConfig() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: TablesUpdate<'habitos_config'>) => {
      requireUser(user)
      const { error } = await supabase.from('habitos_config').update(values).eq('user_id', user.id)
      if (error) throw error
    },
    meta: { action: 'habitos_config.update' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habitos_config', user?.id] }),
  })
}
