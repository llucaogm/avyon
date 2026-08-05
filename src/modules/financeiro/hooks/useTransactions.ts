import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { supabase } from '@/shared/lib/supabaseClient'
import { useAuth } from '@/shared/context/AuthProvider'
import { monthRange } from '@/modules/financeiro/lib/monthUtils'
import { requireUser } from '@/shared/lib/errors'
import type { TablesInsert } from '@/shared/types/database.types'

export function useMonthTransactions(monthDate: Date) {
  const { user } = useAuth()
  const { start, end } = monthRange(monthDate)
  const startIso = format(start, 'yyyy-MM-dd')
  const endIso = format(end, 'yyyy-MM-dd')

  return useQuery({
    queryKey: ['transactions', user?.id, 'month', startIso],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('data', startIso)
        .lte('data', endIso)
        .order('data', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

/** Every transaction logged (created_at) after a given instant — used to project the
 * live account balance forward from the last reconciled saldo_atual_conta. */
export function useTransactionsSince(sinceIso: string | undefined) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['transactions', user?.id, 'since', sinceIso],
    enabled: !!user && !!sinceIso,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .gt('created_at', sinceIso!)
      if (error) throw error
      return data
    },
  })
}

/** Last N transactions, used for description autocomplete + category auto-suggest. */
export function useRecentTransactions(limit = 100) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['transactions', user?.id, 'recent'],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data
    },
  })
}

export function useCreateTransaction() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: Omit<TablesInsert<'transactions'>, 'user_id'>) => {
      requireUser(user)
      const { error } = await supabase.from('transactions').insert({ ...values, user_id: user.id })
      if (error) throw error
    },
    meta: { action: 'transaction.create' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] }),
  })
}

export function useDeleteTransaction() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) throw error
    },
    meta: { action: 'transaction.delete' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] }),
  })
}
