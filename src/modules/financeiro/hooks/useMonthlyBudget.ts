import { useMemo } from 'react'
import { isAfter, startOfMonth } from 'date-fns'
import { useExpenseCategories, useIncomeCategories } from '@/modules/financeiro/hooks/useCategories'
import { useMonthTransactions } from '@/modules/financeiro/hooks/useTransactions'
import { CATEGORY_GROUP_ORDER, type CategoryGroup } from '@/modules/financeiro/lib/categoryGroups'
import type { Tables } from '@/shared/types/database.types'

export interface CategoryBudget {
  categoryId: string
  nome: string
  grupo: CategoryGroup
  frequencia: Tables<'expense_categories'>['frequencia']
  categoriaId: string | null
  cartaoId: string | null
  previsto: number
  realizado: number
}

/** A category with an end_date stops counting toward Previsto the month after it ends. */
function isActiveInMonth(category: Tables<'expense_categories'>, monthDate: Date): boolean {
  if (!category.end_date) return true
  return !isAfter(startOfMonth(monthDate), new Date(category.end_date))
}

export interface GroupBudget {
  grupo: CategoryGroup
  previsto: number
  realizado: number
}

/**
 * Previsto comes from expense_categories.valor_mensal (the plan).
 * Realizado is computed on the fly from this month's transactions — not stored,
 * so it can never drift from the actual ledger like a manually-filled spreadsheet cell would.
 */
export function useMonthlyBudget(monthDate: Date) {
  const { data: categories = [], isLoading: loadingCategories } = useExpenseCategories()
  const { data: transactions = [], isLoading: loadingTransactions } = useMonthTransactions(monthDate)

  const perCategory = useMemo<CategoryBudget[]>(() => {
    return categories
      .filter((c) => isActiveInMonth(c, monthDate))
      .map((c) => {
        const realizado = transactions
          .filter((t) => t.expense_category_id === c.id)
          .reduce((sum, t) => sum + t.valor_saida, 0)
        return {
          categoryId: c.id,
          nome: c.nome,
          grupo: c.grupo,
          frequencia: c.frequencia,
          categoriaId: c.categoria_id,
          cartaoId: c.cartao_id,
          previsto: c.valor_mensal,
          realizado,
        }
      })
  }, [categories, transactions, monthDate])

  const perGroup = useMemo<GroupBudget[]>(() => {
    return CATEGORY_GROUP_ORDER.map((grupo) => {
      const items = perCategory.filter((c) => c.grupo === grupo)
      return {
        grupo,
        previsto: items.reduce((sum, c) => sum + c.previsto, 0),
        realizado: items.reduce((sum, c) => sum + c.realizado, 0),
      }
    })
  }, [perCategory])

  const totals = useMemo(
    () => ({
      previsto: perGroup.reduce((sum, g) => sum + g.previsto, 0),
      realizado: perGroup.reduce((sum, g) => sum + g.realizado, 0),
    }),
    [perGroup],
  )

  return {
    perCategory,
    perGroup,
    totals,
    isLoading: loadingCategories || loadingTransactions,
  }
}

export interface IncomeBudget {
  categoryId: string
  nome: string
  recorrencia: Tables<'income_categories'>['recorrencia']
  categoriaId: string | null
  cartaoId: string | null
  previsto: number
  recebido: number
}

/**
 * Mirrors useMonthlyBudget for the income side: previsto comes from income_categories.valor_mensal,
 * recebido is computed from this month's Entrada transactions actually logged.
 */
export function useMonthlyIncome(monthDate: Date) {
  const { data: categories = [], isLoading: loadingCategories } = useIncomeCategories()
  const { data: transactions = [], isLoading: loadingTransactions } = useMonthTransactions(monthDate)

  const perCategory = useMemo<IncomeBudget[]>(() => {
    return categories.map((c) => {
      const recebido = transactions
        .filter((t) => t.income_category_id === c.id)
        .reduce((sum, t) => sum + t.valor_entrada, 0)
      return {
        categoryId: c.id,
        nome: c.nome,
        recorrencia: c.recorrencia,
        categoriaId: c.categoria_id,
        cartaoId: c.cartao_id,
        previsto: c.valor_mensal,
        recebido,
      }
    })
  }, [categories, transactions])

  return {
    perCategory,
    isLoading: loadingCategories || loadingTransactions,
  }
}
