import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabaseClient'
import { useAuth } from '@/shared/context/AuthProvider'
import { requireUser } from '@/shared/lib/errors'
import type { TablesInsert, TablesUpdate } from '@/shared/types/database.types'

export function useExpenseCategories() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['expense_categories', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('is_active', true)
        .order('grupo')
        .order('nome')
      if (error) throw error
      return data
    },
  })
}

export function useIncomeCategories() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['income_categories', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('income_categories')
        .select('*')
        .eq('is_active', true)
        .order('nome')
      if (error) throw error
      return data
    },
  })
}

export function useCreateExpenseCategory() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: Omit<TablesInsert<'expense_categories'>, 'user_id'>) => {
      requireUser(user)
      const { error } = await supabase
        .from('expense_categories')
        .insert({ ...values, user_id: user.id })
      if (error) throw error
    },
    meta: { action: 'expense_category.create' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expense_categories', user?.id] }),
  })
}

export function useUpdateExpenseCategory() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TablesUpdate<'expense_categories'> }) => {
      const { error } = await supabase.from('expense_categories').update(values).eq('id', id)
      if (error) throw error
    },
    meta: { action: 'expense_category.update' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expense_categories', user?.id] }),
  })
}

export function useDeleteExpenseCategory() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expense_categories')
        .update({ is_active: false })
        .eq('id', id)
      if (error) throw error
    },
    meta: { action: 'expense_category.delete' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expense_categories', user?.id] }),
  })
}

export function useCreateIncomeCategory() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: Omit<TablesInsert<'income_categories'>, 'user_id'>) => {
      requireUser(user)
      const { error } = await supabase
        .from('income_categories')
        .insert({ ...values, user_id: user.id })
      if (error) throw error
    },
    meta: { action: 'income_category.create' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['income_categories', user?.id] }),
  })
}

export function useUpdateIncomeCategory() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TablesUpdate<'income_categories'> }) => {
      const { error } = await supabase.from('income_categories').update(values).eq('id', id)
      if (error) throw error
    },
    meta: { action: 'income_category.update' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['income_categories', user?.id] }),
  })
}

export function useDeleteIncomeCategory() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('income_categories')
        .update({ is_active: false })
        .eq('id', id)
      if (error) throw error
    },
    meta: { action: 'income_category.delete' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['income_categories', user?.id] }),
  })
}
