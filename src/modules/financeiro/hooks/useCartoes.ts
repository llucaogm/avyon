import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabaseClient'
import { useAuth } from '@/shared/context/AuthProvider'
import { requireUser } from '@/shared/lib/errors'
import { useAppSettings } from '@/modules/financeiro/hooks/useAppSettings'
import { useTransactionsSince } from '@/modules/financeiro/hooks/useTransactions'
import { computeCartaoSaldo } from '@/modules/financeiro/lib/cartaoSaldo'
import type { Enums, TablesInsert, TablesUpdate } from '@/shared/types/database.types'

type CartaoTipo = Enums<'cartao_tipo'>

/** Cartões ativos do usuário, com filtro opcional por tipo (débito/crédito). */
export function useCartoes(tipo?: CartaoTipo) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['cartoes', user?.id, tipo],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase.from('cartoes').select('*').eq('is_active', true).order('created_at')
      if (tipo) query = query.eq('tipo', tipo)
      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

/** Todas as transações vinculadas a algum cartão — alimenta computeCartaoSaldo no cliente. */
export function useCartaoTransacoes() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['transactions', user?.id, 'cartoes'],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('cartao_id,valor_entrada,valor_saida,created_at')
        .not('cartao_id', 'is', null)
      if (error) throw error
      return data
    },
  })
}

export function useCreateCartao() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: Omit<TablesInsert<'cartoes'>, 'user_id'>) => {
      requireUser(user)
      const { error } = await supabase.from('cartoes').insert({ ...values, user_id: user.id })
      if (error) throw error
    },
    meta: { action: 'cartao.create' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cartoes', user?.id] }),
  })
}

/** Também serve pra "ajustar saldo" de um débito: atualizar saldo_reconciliado
 * exige carimbar saldo_reconciliado_em = agora, senão a fórmula soma duas vezes. */
export function useUpdateCartao() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TablesUpdate<'cartoes'> }) => {
      const { error } = await supabase.from('cartoes').update(values).eq('id', id)
      if (error) throw error
    },
    meta: { action: 'cartao.update' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cartoes', user?.id] }),
  })
}

export function useDeleteCartao() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cartoes').update({ is_active: false }).eq('id', id)
      if (error) throw error
    },
    meta: { action: 'cartao.delete' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cartoes', user?.id] }),
  })
}

/** Saldo geral: soma dos cartões de débito ativos, se já existir algum — senão
 * cai no cálculo legado (app_settings.saldo_atual_conta + transações desde a
 * reconciliação), pra não quebrar o dashboard antes do usuário migrar. */
export function useSaldoGlobal() {
  const { data: debitos = [], isLoading: loadingDebitos } = useCartoes('debito')
  const { data: transacoesCartoes = [], isLoading: loadingTransacoes } = useCartaoTransacoes()
  const { data: settings, isLoading: loadingSettings } = useAppSettings()
  const { data: txSinceReconciliation = [], isLoading: loadingSince } = useTransactionsSince(settings?.saldo_atual_em)

  const usaCartoes = debitos.length > 0

  const saldo = useMemo(() => {
    if (usaCartoes) {
      return debitos.reduce((sum, cartao) => sum + computeCartaoSaldo(cartao, transacoesCartoes), 0)
    }
    const base = settings?.saldo_atual_conta ?? 0
    const delta = txSinceReconciliation.reduce((sum, t) => sum + t.valor_entrada - t.valor_saida, 0)
    return base + delta
  }, [usaCartoes, debitos, transacoesCartoes, settings?.saldo_atual_conta, txSinceReconciliation])

  return {
    saldo,
    usaCartoes,
    isLoading: usaCartoes
      ? loadingDebitos || loadingTransacoes
      : loadingSettings || loadingSince || loadingDebitos,
  }
}
