import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabaseClient'
import { useAuth } from '@/shared/context/AuthProvider'
import type { NodePositions } from '@/modules/estudos/lib/mindMapLayout'
import type { Tables } from '@/shared/types/database.types'

interface CriarMapaMentalInput {
  notaIds: string[]
  mapaId?: string
}

interface CriarMapaMentalResult {
  mapa: Tables<'mapas_mentais'>
}

/** Mapas mentais do usuário, mais recentemente atualizados primeiro. */
export function useMapasMentais() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['mapasMentais', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mapas_mentais')
        .select('*')
        .order('updated_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useMapaMental(id?: string) {
  return useQuery({
    queryKey: ['mapaMental', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('mapas_mentais').select('*').eq('id', id!).single()
      if (error) throw error
      return data
    },
  })
}

/** Gera (ou, com `mapaId`, regenera) um mapa mental a partir das notas selecionadas. */
export function useCriarMapaMental() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CriarMapaMentalInput) => {
      const { data, error } = await supabase.functions.invoke<CriarMapaMentalResult>('mindmap', {
        body: input,
      })
      if (error) throw error
      if (!data) throw new Error('Resposta vazia ao gerar o mapa')
      return data.mapa
    },
    meta: { action: 'mapaMental.criar' },
    onSuccess: (mapa) => {
      queryClient.invalidateQueries({ queryKey: ['mapasMentais', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['mapaMental', mapa.id] })
    },
  })
}

/** Persists dragged node positions. Pure DB write, no AI involved — RLS lets
 * the user update their own row directly, no need to go through the Edge Function. */
export function useSalvarPosicoes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ mapaId, posicoes }: { mapaId: string; posicoes: NodePositions }) => {
      const { error } = await supabase.from('mapas_mentais').update({ posicoes }).eq('id', mapaId)
      if (error) throw error
    },
    meta: { action: 'mapaMental.salvarPosicoes' },
    onSuccess: (_data, { mapaId }) => {
      queryClient.invalidateQueries({ queryKey: ['mapaMental', mapaId] })
    },
  })
}

export function useDeleteMapaMental() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('mapas_mentais').delete().eq('id', id)
      if (error) throw error
    },
    meta: { action: 'mapaMental.delete' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mapasMentais', user?.id] }),
  })
}
