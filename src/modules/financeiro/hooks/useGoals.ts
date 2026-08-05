import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabaseClient'
import { useAuth } from '@/shared/context/AuthProvider'
import { requireUser } from '@/shared/lib/errors'
import type { TablesInsert } from '@/shared/types/database.types'

export function useGoals() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['goals', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function useGoalContributions() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['goal_contributions', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('goal_contributions').select('*')
      if (error) throw error
      return data
    },
  })
}

export function useCreateGoal() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: Omit<TablesInsert<'goals'>, 'user_id'>) => {
      requireUser(user)
      const { error } = await supabase.from('goals').insert({ ...values, user_id: user.id })
      if (error) throw error
    },
    meta: { action: 'goal.create' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals', user?.id] }),
  })
}

export function useAddGoalContribution() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: Omit<TablesInsert<'goal_contributions'>, 'user_id'>) => {
      requireUser(user)
      const { error } = await supabase
        .from('goal_contributions')
        .insert({ ...values, user_id: user.id })
      if (error) throw error
    },
    meta: { action: 'goal_contribution.create' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goal_contributions', user?.id] }),
  })
}
