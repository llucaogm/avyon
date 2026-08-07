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
 * `currentMonthActual`, when given, replaces month zero's plan-based totals with the
 * real sum of everything already logged in Lançamentos this month (fixed-linked and
 * avulso alike) — it's the only month we can know those for, since future months
 * haven't happened yet. `saldoInicial` must then already exclude this month's
 * transactions (i.e. be the balance as of the start of the month), or they'd be
 * double-counted.
 *
 * `extraSaidas[i]`, when given, adds a one-off amount to month i's saídas — used by
 * the purchase simulator to see how a lump-sum or installment purchase ripples
 * through the projection without touching the underlying categories.
 */
export function computeForecast(
  expenseCategories: ExpenseCategory[],
  incomeCategories: IncomeCategory[],
  saldoInicial: number,
  monthsAhead = 12,
  startDate = new Date(),
  currentMonthActual?: { entradas: number; saidas: number },
  extraSaidas?: number[],
): ForecastMonth[] {
  const mensalIncome = incomeCategories
    .filter((c) => c.recorrencia === 'mensal')
    .reduce((sum, c) => sum + c.valor_mensal, 0)

  const months: ForecastMonth[] = []
  let saldoAcumulado = saldoInicial

  for (let i = 0; i < monthsAhead; i++) {
    const monthDate = startOfMonth(addMonths(startDate, i))

    let totalSaidas: number
    let totalEntradas: number

    if (i === 0 && currentMonthActual) {
      totalSaidas = currentMonthActual.saidas
      totalEntradas = currentMonthActual.entradas
    } else {
      totalSaidas = expenseCategories
        .filter((c) => isChargedInMonth(c, monthDate))
        .reduce((sum, c) => sum + c.valor_mensal, 0)
      totalEntradas = mensalIncome
    }

    totalSaidas += extraSaidas?.[i] ?? 0

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
