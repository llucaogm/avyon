import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabaseClient'
import { useAuth } from '@/shared/context/AuthProvider'
import { requireUser } from '@/shared/lib/errors'
import { blocosPadrao, type RoteiroBloco } from '@/modules/producao/lib/roteiroBlocos'
import type { Json } from '@/shared/types/database.types'

export function useRoteiros() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['roteiros', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('roteiros').select('*').order('updated_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useRoteiro(id?: string) {
  return useQuery({
    queryKey: ['roteiro', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('roteiros').select('*').eq('id', id!).single()
      if (error) throw error
      return data
    },
  })
}

/** Já insere com os 3 blocos padrão (Hook/Desenvolvimento/CTA) — o usuário
 * renomeia/reordena/adiciona a partir daí. */
export function useCreateRoteiro() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: { titulo: string; post_id?: string | null }) => {
      requireUser(user)
      const { data, error } = await supabase
        .from('roteiros')
        .insert({
          titulo: values.titulo,
          post_id: values.post_id ?? null,
          blocos: blocosPadrao() as unknown as Json,
          user_id: user.id,
        })
        .select('*')
        .single()
      if (error) throw error
      return data
    },
    meta: { action: 'roteiro.create' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roteiros', user?.id] }),
  })
}

export function useUpdateRoteiro() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      titulo,
      post_id,
      blocos,
    }: {
      id: string
      titulo: string
      post_id: string | null
      blocos: RoteiroBloco[]
    }) => {
      const { error } = await supabase
        .from('roteiros')
        .update({ titulo, post_id, blocos: blocos as unknown as Json })
        .eq('id', id)
      if (error) throw error
    },
    meta: { action: 'roteiro.update' },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['roteiros', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['roteiro', id] })
    },
  })
}

export function useDeleteRoteiro() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('roteiros').delete().eq('id', id)
      if (error) throw error
    },
    meta: { action: 'roteiro.delete' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roteiros', user?.id] }),
  })
}
