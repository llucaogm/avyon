import { useMemo } from 'react'
import { getDate, getDaysInMonth } from 'date-fns'
import { useExpenseCategories } from '@/modules/financeiro/hooks/useCategories'
import { useMonthTransactions } from '@/modules/financeiro/hooks/useTransactions'
import type { Tables } from '@/shared/types/database.types'

export interface SpendingPacePoint {
  dia: number
  real: number
  guia: number
}

export interface SpendingPace {
  series: SpendingPacePoint[]
  diasRestantes: number
  tetoDiarioRecomendado: number
}

/**
 * Always pinned to the actual current month, regardless of the page's MonthSwitcher —
 * "days remaining" and a daily burn ceiling only make sense for the month you're
 * actually living in.
 */
export function useSpendingPace(disponivelFlexivel: number, restanteFlexivel: number): SpendingPace {
  const hoje = new Date()
  const { data: expenseCategories = [] } = useExpenseCategories()
  const { data: transactions = [] } = useMonthTransactions(hoje)

  return useMemo(() => {
    const variavelIds = new Set(expenseCategories.filter((c) => c.grupo === 'variavel').map((c) => c.id))
    const isFlexivel = (t: Tables<'transactions'>) =>
      (t.expense_category_id !== null && variavelIds.has(t.expense_category_id)) ||
      (!t.expense_category_id && !t.income_category_id)

    const diasNoMes = getDaysInMonth(hoje)
    const diaAtual = getDate(hoje)
    const diasRestantes = diasNoMes - diaAtual + 1
    const tetoDiarioRecomendado = restanteFlexivel / diasRestantes

    const gastoPorDia = new Map<number, number>()
    for (const t of transactions) {
      if (!isFlexivel(t)) continue
      const dia = Number(t.data.slice(8, 10))
      gastoPorDia.set(dia, (gastoPorDia.get(dia) ?? 0) + t.valor_saida)
    }

    const series: SpendingPacePoint[] = []
    let acumulado = 0
    for (let dia = 1; dia <= diaAtual; dia++) {
      acumulado += gastoPorDia.get(dia) ?? 0
      const guia = diasNoMes > 1 ? disponivelFlexivel * (1 - (dia - 1) / (diasNoMes - 1)) : 0
      series.push({ dia, real: disponivelFlexivel - acumulado, guia })
    }

    return { series, diasRestantes, tetoDiarioRecomendado }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseCategories, transactions, disponivelFlexivel, restanteFlexivel])
}
