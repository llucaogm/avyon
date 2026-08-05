import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabaseClient'
import { useAuth } from '@/shared/context/AuthProvider'
import { requireUser } from '@/shared/lib/errors'
import type { TablesUpdate } from '@/shared/types/database.types'

export function useAppSettings() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['app_settings', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('user_id', user!.id)
        .single()
      if (error) throw error
      return data
    },
  })
}

export function useUpdateAppSettings() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: TablesUpdate<'app_settings'>) => {
      requireUser(user)
      const { error } = await supabase.from('app_settings').update(values).eq('user_id', user.id)
      if (error) throw error
    },
    meta: { action: 'app_settings.update' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['app_settings', user?.id] }),
  })
}
