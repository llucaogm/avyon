import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabaseClient'
import { useAuth } from '@/shared/context/AuthProvider'

interface EnviarMensagemInput {
  conversaId?: string
  notaId?: string
  mensagem: string
}

interface EnviarMensagemResult {
  conversaId: string
  resposta: string
}

/** Conversas do usuário, mais recentemente atualizadas primeiro. */
export function useConversas() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['conversas', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversas')
        .select('*')
        .order('updated_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

/** Mensagens de uma conversa, em ordem cronológica. */
export function useMensagens(conversaId?: string) {
  return useQuery({
    queryKey: ['mensagens', conversaId],
    enabled: !!conversaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mensagens')
        .select('*')
        .eq('conversa_id', conversaId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

/** Envia uma mensagem pra Edge Function `chat`, que fala com a IA e persiste o histórico. */
export function useEnviarMensagem() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: EnviarMensagemInput) => {
      const { data, error } = await supabase.functions.invoke<EnviarMensagemResult>('chat', {
        body: input,
      })
      if (error) throw error
      if (!data) throw new Error('Resposta vazia do chat')
      return data
    },
    meta: { action: 'chat.enviarMensagem' },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mensagens', data.conversaId] })
      queryClient.invalidateQueries({ queryKey: ['conversas', user?.id] })
    },
  })
}

export function useDeleteConversa() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('conversas').delete().eq('id', id)
      if (error) throw error
    },
    meta: { action: 'conversa.delete' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversas', user?.id] }),
  })
}
