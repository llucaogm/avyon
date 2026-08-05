import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabaseClient'
import { useAuth } from '@/shared/context/AuthProvider'
import { requireUser } from '@/shared/lib/errors'
import type { TablesInsert, TablesUpdate } from '@/shared/types/database.types'

export function useHabits() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['habits', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('is_active', true)
        .order('ordem')
        .order('nome')
      if (error) throw error
      return data
    },
  })
}

export function useCreateHabit() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: Omit<TablesInsert<'habits'>, 'user_id'>) => {
      requireUser(user)
      const { error } = await supabase.from('habits').insert({ ...values, user_id: user.id })
      if (error) throw error
    },
    meta: { action: 'habit.create' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits', user?.id] }),
  })
}

export function useUpdateHabit() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TablesUpdate<'habits'> }) => {
      const { error } = await supabase.from('habits').update(values).eq('id', id)
      if (error) throw error
    },
    meta: { action: 'habit.update' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits', user?.id] }),
  })
}

export function useDeactivateHabit() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('habits').update({ is_active: false }).eq('id', id)
      if (error) throw error
    },
    meta: { action: 'habit.deactivate' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits', user?.id] }),
  })
}
