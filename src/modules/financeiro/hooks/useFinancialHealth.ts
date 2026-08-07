import { useMemo } from 'react'
import { useMonthlyBudget } from '@/modules/financeiro/hooks/useMonthlyBudget'
import { useMonthTransactions } from '@/modules/financeiro/hooks/useTransactions'

export interface FinancialHealth {
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
 */
export function useFinancialHealth(monthDate: Date, rendaLiquida: number): FinancialHealth {
  const { perGroup, isLoading: loadingBudget } = useMonthlyBudget(monthDate)
  const { data: transactions = [], isLoading: loadingTx } = useMonthTransactions(monthDate)

  return useMemo(() => {
    const custosFixos = perGroup.find((g) => g.grupo === 'fixo')?.previsto ?? 0
    const investido =
      (perGroup.find((g) => g.grupo === 'objetivo')?.previsto ?? 0) +
      (perGroup.find((g) => g.grupo === 'reserva')?.previsto ?? 0)
    const realizadoVariavel = perGroup.find((g) => g.grupo === 'variavel')?.realizado ?? 0
    const avulsoSaidas = transactions
      .filter((t) => !t.expense_category_id && !t.income_category_id)
      .reduce((sum, t) => sum + t.valor_saida, 0)

    const gastoFlexivelRealizado = realizadoVariavel + avulsoSaidas
    const disponivelFlexivel = rendaLiquida - custosFixos - investido
    const restanteFlexivel = disponivelFlexivel - gastoFlexivelRealizado
    const percentualComprometido = rendaLiquida > 0 ? (custosFixos + investido) / rendaLiquida : 0

    return {
      custosFixos,
      investido,
      gastoFlexivelRealizado,
      disponivelFlexivel,
      restanteFlexivel,
      percentualComprometido,
      isLoading: loadingBudget || loadingTx,
    }
  }, [perGroup, transactions, rendaLiquida, loadingBudget, loadingTx])
}
