import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabaseClient'
import { useAuth } from '@/shared/context/AuthProvider'
import { requireUser } from '@/shared/lib/errors'
import type { TablesInsert, TablesUpdate } from '@/shared/types/database.types'

/** Manuais/colas de referência — cada um é um HTML autocontido que o usuário
 * cola pronto (ex: gerado numa conversa) e guarda pra consultar depois. */
export function useConsultas() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['consultas', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultas')
        .select('id, titulo, descricao, materia_id, created_at, updated_at')
        .order('updated_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useConsulta(id?: string) {
  return useQuery({
    queryKey: ['consulta', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('consultas').select('*').eq('id', id!).single()
      if (error) throw error
      return data
    },
  })
}

export function useCreateConsulta() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: Omit<TablesInsert<'consultas'>, 'user_id'>) => {
      requireUser(user)
      const { data, error } = await supabase
        .from('consultas')
        .insert({ ...values, user_id: user.id })
        .select('*')
        .single()
      if (error) throw error
      return data
    },
    meta: { action: 'consulta.create' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['consultas', user?.id] }),
  })
}

export function useUpdateConsulta() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TablesUpdate<'consultas'> }) => {
      const { error } = await supabase.from('consultas').update(values).eq('id', id)
      if (error) throw error
    },
    meta: { action: 'consulta.update' },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['consultas', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['consulta', id] })
    },
  })
}

export function useDeleteConsulta() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('consultas').delete().eq('id', id)
      if (error) throw error
    },
    meta: { action: 'consulta.delete' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['consultas', user?.id] }),
  })
}
