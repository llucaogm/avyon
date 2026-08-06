import { addMonths, format, isAfter, startOfMonth } from 'date-fns'
import type { Tables } from '@/shared/types/database.types'

type ExpenseCategory = Tables<'expense_categories'>
type IncomeCategory = Tables<'income_categories'>

export interface ForecastMonth {
  monthDate: Date
  monthKey: string
  totalSaidas: number
  totalEntradas: number
  saldoAcumulado: number
}

function isActiveInMonth(category: ExpenseCategory, monthDate: Date): boolean {
  if (!category.end_date) return true
  const end = new Date(category.end_date)
  // A category is still active during its end month; it stops being charged after.
  return !isAfter(startOfMonth(monthDate), end)
}

function isChargedInMonth(category: ExpenseCategory, monthDate: Date): boolean {
  if (!isActiveInMonth(category, monthDate)) return false

  const month = monthDate.getMonth() + 1 // 1-12

  switch (category.frequencia) {
    case 'mensal':
      return true
    case 'anual':
      return category.due_month != null && category.due_month === month
    case 'semestral': {
      if (category.due_month == null) return false
      const diff = (month - category.due_month + 12) % 12
      return diff % 6 === 0
    }
    case 'unico': {
      if (!category.charge_date) return false
      const chargeDate = new Date(category.charge_date)
      return (
        chargeDate.getFullYear() === monthDate.getFullYear() &&
        chargeDate.getMonth() === monthDate.getMonth()
      )
    }
    default:
      return false
  }
}

/**
 * Projects cash flow for the next `monthsAhead` months, replacing the spreadsheet's
 * manually-cascaded "Projeção Futura" sheet with a pure computation over the current
 * categories + starting balance. Only mensal income is projected forward — anual/
 * semestral/eventual income is too irregular to forecast reliably and is left out here
 * (it's still counted in the Dashboard's current-month renda total).
 *
 * `avulsoAtual` folds in this month's already-logged transactions that aren't tied to
 * any Gasto Fixo/Receita Fixa (one-off entries like a random beer or a freelance gig) —
 * the only month we can know those for, since future ones haven't happened yet.
 */
export function computeForecast(
  expenseCategories: ExpenseCategory[],
  incomeCategories: IncomeCategory[],
  saldoInicial: number,
  monthsAhead = 12,
  startDate = new Date(),
  avulsoAtual: { entradas: number; saidas: number } = { entradas: 0, saidas: 0 },
): ForecastMonth[] {
  const mensalIncome = incomeCategories
    .filter((c) => c.recorrencia === 'mensal')
    .reduce((sum, c) => sum + c.valor_mensal, 0)

  const months: ForecastMonth[] = []
  let saldoAcumulado = saldoInicial

  for (let i = 0; i < monthsAhead; i++) {
    const monthDate = startOfMonth(addMonths(startDate, i))
    let totalSaidas = expenseCategories
      .filter((c) => isChargedInMonth(c, monthDate))
      .reduce((sum, c) => sum + c.valor_mensal, 0)
    let totalEntradas = mensalIncome

    if (i === 0) {
      totalSaidas += avulsoAtual.saidas
      totalEntradas += avulsoAtual.entradas
    }

    saldoAcumulado = saldoAcumulado + totalEntradas - totalSaidas

    months.push({
      monthDate,
      monthKey: format(monthDate, 'yyyy-MM-dd'),
      totalSaidas,
      totalEntradas,
      saldoAcumulado,
    })
  }

  return months
}
