import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabaseClient'
import { useAuth } from '@/shared/context/AuthProvider'
import { requireUser } from '@/shared/lib/errors'
import type { TablesInsert, TablesUpdate } from '@/shared/types/database.types'

export function usePosts() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['posts', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useCreatePost() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: Omit<TablesInsert<'posts'>, 'user_id'>) => {
      requireUser(user)
      const { error } = await supabase.from('posts').insert({ ...values, user_id: user.id })
      if (error) throw error
    },
    meta: { action: 'post.create' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts', user?.id] }),
  })
}

export function useUpdatePost() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TablesUpdate<'posts'> }) => {
      const { error } = await supabase.from('posts').update(values).eq('id', id)
      if (error) throw error
    },
    meta: { action: 'post.update' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts', user?.id] }),
  })
}

export function useDeletePost() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('posts').delete().eq('id', id)
      if (error) throw error
    },
    meta: { action: 'post.delete' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts', user?.id] }),
  })
}
