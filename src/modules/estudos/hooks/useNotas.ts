import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabaseClient'
import { useAuth } from '@/shared/context/AuthProvider'
import { requireUser } from '@/shared/lib/errors'
import type { TablesInsert, TablesUpdate } from '@/shared/types/database.types'

/** All of the user's notes, most recently updated first — filtered client-side
 * (busca/matéria/tipo) same as TransactionsPage's search, small enough dataset. */
export function useNotas() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['notas', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notas')
        .select('*')
        .order('updated_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useCreateNota() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: Omit<TablesInsert<'notas'>, 'user_id'>) => {
      requireUser(user)
      const { error } = await supabase.from('notas').insert({ ...values, user_id: user.id })
      if (error) throw error
    },
    meta: { action: 'nota.create' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notas', user?.id] }),
  })
}

export function useUpdateNota() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TablesUpdate<'notas'> }) => {
      const { error } = await supabase
        .from('notas')
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    meta: { action: 'nota.update' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notas', user?.id] }),
  })
}

export function useDeleteNota() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notas').delete().eq('id', id)
      if (error) throw error
    },
    meta: { action: 'nota.delete' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notas', user?.id] }),
  })
}
