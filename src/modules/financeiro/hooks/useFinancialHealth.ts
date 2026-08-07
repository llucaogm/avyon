import { useMemo } from 'react'
import { useMonthlyBudget } from '@/modules/financeiro/hooks/useMonthlyBudget'
import { useMonthTransactions } from '@/modules/financeiro/hooks/useTransactions'

export interface FinancialHealth {
  entradasRealizadas: number
  custosFixos: number
  investido: number
  gastoFlexivelRealizado: number
  disponivelFlexivel: number
  restanteFlexivel: number
  percentualComprometido: number
  isLoading: boolean
}

/**
 * Central "financial health" numbers for a given month, shared by the Fluxo de Caixa
 * Livre card, the Matriz Fixo x Flexível card, and (for the current month specifically)
 * the Ritmo de Gastos thermometer — all three should always agree with each other, so
 * this is computed once here instead of three times with slightly different logic.
 *
 * Everything here is derived from REAL transactions this month, not the planned
 * valor_mensal — every transaction belongs to exactly one grupo (or none = avulso), so
 * custosFixos + investido + gastoFlexivelRealizado always sums to exactly this month's
 * total saídas, and restanteFlexivel always reconciles with entradasRealizadas minus
 * that total. A category's planned amount only matters until money actually moves.
 */
export function useFinancialHealth(monthDate: Date): FinancialHealth {
  const { perGroup, isLoading: loadingBudget } = useMonthlyBudget(monthDate)
  const { data: transactions = [], isLoading: loadingTx } = useMonthTransactions(monthDate)

  return useMemo(() => {
    const custosFixos = perGroup.find((g) => g.grupo === 'fixo')?.realizado ?? 0
    const investido =
      (perGroup.find((g) => g.grupo === 'objetivo')?.realizado ?? 0) +
      (perGroup.find((g) => g.grupo === 'reserva')?.realizado ?? 0)
    const realizadoVariavel = perGroup.find((g) => g.grupo === 'variavel')?.realizado ?? 0
    const avulsoSaidas = transactions
      .filter((t) => !t.expense_category_id && !t.income_category_id)
      .reduce((sum, t) => sum + t.valor_saida, 0)

    const entradasRealizadas = transactions.reduce((sum, t) => sum + t.valor_entrada, 0)
    const gastoFlexivelRealizado = realizadoVariavel + avulsoSaidas
    const disponivelFlexivel = entradasRealizadas - custosFixos - investido
    const restanteFlexivel = disponivelFlexivel - gastoFlexivelRealizado
    const percentualComprometido =
      entradasRealizadas > 0 ? (custosFixos + investido) / entradasRealizadas : 0

    return {
      entradasRealizadas,
      custosFixos,
      investido,
      gastoFlexivelRealizado,
      disponivelFlexivel,
      restanteFlexivel,
      percentualComprometido,
      isLoading: loadingBudget || loadingTx,
    }
  }, [perGroup, transactions, loadingBudget, loadingTx])
}
