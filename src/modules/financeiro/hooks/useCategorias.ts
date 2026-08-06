import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabaseClient'
import { useAuth } from '@/shared/context/AuthProvider'
import { requireUser } from '@/shared/lib/errors'
import type { Enums, TablesInsert, TablesUpdate } from '@/shared/types/database.types'

export type CategoriaTipo = Enums<'categoria_tipo'>

export function useCategorias(tipo: CategoriaTipo) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['categorias', user?.id, tipo],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('tipo', tipo)
        .eq('is_active', true)
        .order('ordem')
        .order('nome')
      if (error) throw error
      return data
    },
  })
}

export function useCreateCategoria() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: Omit<TablesInsert<'categorias'>, 'user_id'>) => {
      requireUser(user)
      const { error } = await supabase.from('categorias').insert({ ...values, user_id: user.id })
      if (error) throw error
    },
    meta: { action: 'categoria.create' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categorias', user?.id] }),
  })
}

export function useUpdateCategoria() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TablesUpdate<'categorias'> }) => {
      const { error } = await supabase.from('categorias').update(values).eq('id', id)
      if (error) throw error
    },
    meta: { action: 'categoria.update' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categorias', user?.id] }),
  })
}

export function useDeleteCategoria() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categorias').update({ is_active: false }).eq('id', id)
      if (error) throw error
    },
    meta: { action: 'categoria.delete' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categorias', user?.id] }),
  })
}
