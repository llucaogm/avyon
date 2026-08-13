import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabaseClient'
import { useAuth } from '@/shared/context/AuthProvider'
import { requireUser } from '@/shared/lib/errors'

export function useIdeias() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['ideias', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ideias')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useCreateIdeia() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (conteudo: string) => {
      requireUser(user)
      const { error } = await supabase.from('ideias').insert({ conteudo, user_id: user.id })
      if (error) throw error
    },
    meta: { action: 'ideia.create' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ideias', user?.id] }),
  })
}

export function useDeleteIdeia() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ideias').delete().eq('id', id)
      if (error) throw error
    },
    meta: { action: 'ideia.delete' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ideias', user?.id] }),
  })
}
