import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabaseClient'
import { useAuth } from '@/shared/context/AuthProvider'
import { monthKey } from '@/modules/financeiro/lib/monthUtils'
import { requireUser } from '@/shared/lib/errors'

export function useCategoryMonthStatus(monthDate: Date) {
  const { user } = useAuth()
  const yearMonth = monthKey(monthDate)

  return useQuery({
    queryKey: ['category_month_status', user?.id, yearMonth],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('category_month_status')
        .select('*')
        .eq('year_month', yearMonth)
      if (error) throw error
      return data
    },
  })
}

export function useSetCategoryPago(monthDate: Date) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const yearMonth = monthKey(monthDate)

  return useMutation({
    mutationFn: async ({ categoryId, pago }: { categoryId: string; pago: boolean }) => {
      requireUser(user)
      const { error } = await supabase
        .from('category_month_status')
        .upsert(
          { user_id: user.id, category_id: categoryId, year_month: yearMonth, pago },
          { onConflict: 'category_id,year_month' },
        )
      if (error) throw error
    },
    meta: { action: 'category_month_status.set_pago' },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['category_month_status', user?.id, yearMonth] }),
  })
}
