import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabaseClient'
import { useAuth } from '@/shared/context/AuthProvider'
import { requireUser } from '@/shared/lib/errors'
import type { TablesInsert, TablesUpdate } from '@/shared/types/database.types'

export function useMaterias() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['materias', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('materias').select('*').order('nome')
      if (error) throw error
      return data
    },
  })
}

export function useCreateMateria() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: Omit<TablesInsert<'materias'>, 'user_id'>) => {
      requireUser(user)
      const { error } = await supabase.from('materias').insert({ ...values, user_id: user.id })
      if (error) throw error
    },
    meta: { action: 'materia.create' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materias', user?.id] }),
  })
}

export function useUpdateMateria() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TablesUpdate<'materias'> }) => {
      const { error } = await supabase.from('materias').update(values).eq('id', id)
      if (error) throw error
    },
    meta: { action: 'materia.update' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materias', user?.id] }),
  })
}

export function useDeleteMateria() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('materias').delete().eq('id', id)
      if (error) throw error
    },
    meta: { action: 'materia.delete' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materias', user?.id] })
      // A nota que apontava pra essa matéria agora tem materia_id null (on delete
      // set null) — as notas em cache precisam refletir isso.
      queryClient.invalidateQueries({ queryKey: ['notas', user?.id] })
    },
  })
}
