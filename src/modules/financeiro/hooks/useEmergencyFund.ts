import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabaseClient'
import { useAuth } from '@/shared/context/AuthProvider'
import { requireUser } from '@/shared/lib/errors'
import type { TablesInsert, TablesUpdate } from '@/shared/types/database.types'

export function useEmergencyFundConfig() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['emergency_fund_config', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emergency_fund_config')
        .select('*')
        .eq('user_id', user!.id)
        .single()
      if (error) throw error
      return data
    },
  })
}

export function useUpdateEmergencyFundConfig() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: TablesUpdate<'emergency_fund_config'>) => {
      requireUser(user)
      const { error } = await supabase
        .from('emergency_fund_config')
        .update(values)
        .eq('user_id', user.id)
      if (error) throw error
    },
    meta: { action: 'emergency_fund_config.update' },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['emergency_fund_config', user?.id] }),
  })
}

export function useEmergencyFundContributions() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['emergency_fund_contributions', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emergency_fund_contributions')
        .select('*')
        .order('mes', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function useAddEmergencyFundContribution() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: Omit<TablesInsert<'emergency_fund_contributions'>, 'user_id'>) => {
      requireUser(user)
      const { error } = await supabase
        .from('emergency_fund_contributions')
        .insert({ ...values, user_id: user.id })
      if (error) throw error
    },
    meta: { action: 'emergency_fund_contribution.create' },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['emergency_fund_contributions', user?.id] }),
  })
}
