import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabaseClient'
import { useAuth } from '@/shared/context/AuthProvider'
import { requireUser } from '@/shared/lib/errors'
import type { Enums, TablesInsert, TablesUpdate } from '@/shared/types/database.types'

interface OembedResult {
  plataforma: Enums<'post_plataforma'>
  titulo: string | null
  autor: string | null
  thumbnail_url: string | null
}

/** Busca pontual — não é uma mutation de dados do app, só um proxy pra Edge
 * Function que consulta o oEmbed público de YouTube/TikTok (Instagram não tem
 * oEmbed público, volta com campos vazios de propósito). */
export function useFetchOembed() {
  return useMutation({
    mutationFn: async (url: string) => {
      const { data, error } = await supabase.functions.invoke<OembedResult>('oembed', { body: { url } })
      if (error) throw error
      if (!data) throw new Error('Resposta vazia ao buscar preview')
      return data
    },
    meta: { action: 'referencia.fetch_oembed' },
  })
}

export function useReferencias() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['referencias', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referencias')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useCreateReferencia() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: Omit<TablesInsert<'referencias'>, 'user_id'>) => {
      requireUser(user)
      const { error } = await supabase.from('referencias').insert({ ...values, user_id: user.id })
      if (error) throw error
    },
    meta: { action: 'referencia.create' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['referencias', user?.id] }),
  })
}

export function useUpdateReferencia() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TablesUpdate<'referencias'> }) => {
      const { error } = await supabase.from('referencias').update(values).eq('id', id)
      if (error) throw error
    },
    meta: { action: 'referencia.update' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['referencias', user?.id] }),
  })
}

export function useDeleteReferencia() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('referencias').delete().eq('id', id)
      if (error) throw error
    },
    meta: { action: 'referencia.delete' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['referencias', user?.id] }),
  })
}
