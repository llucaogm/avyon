import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Badge } from '@/shared/components/ui/badge'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { expenseCategoriesForMonth, type ForecastMonth } from '@/modules/financeiro/lib/forecast'
import { formatCurrency, formatMonthLabel } from '@/shared/lib/formatters'
import { cn } from '@/shared/lib/utils'
import type { Tables } from '@/shared/types/database.types'

interface Item {
  id: string
  nome: string
  valor: number
}

interface MonthDetailSheetProps {
  month: ForecastMonth | null
  onOpenChange: (v: boolean) => void
  isCurrentMonth: boolean
  currentMonthTransactions: Tables<'transactions'>[]
  expenseCategories: Tables<'expense_categories'>[]
  incomeCategories: Tables<'income_categories'>[]
  extraSaida?: number
}

function ItemRow({ item, tipo }: { item: Item; tipo: 'entrada' | 'saida' }) {
  const isEntrada = tipo === 'entrada'
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex min-w-0 items-center gap-2.5">
        {isEntrada ? (
          <ArrowUpCircle className="size-4 shrink-0 text-primary" />
        ) : (
          <ArrowDownCircle className="size-4 shrink-0 text-destructive" />
        )}
        <p className="truncate text-sm">{item.nome}</p>
      </div>
      <span className={`shrink-0 text-sm font-medium ${isEntrada ? 'text-primary' : 'text-destructive'}`}>
        {formatCurrency(item.valor)}
      </span>
    </div>
  )
}

function Section({ title, items, tipo, total }: { title: string; items: Item[]; tipo: 'entrada' | 'saida'; total: number }) {
  if (items.length === 0) return null
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</p>
        <p className={`text-xs font-medium ${tipo === 'entrada' ? 'text-primary' : 'text-destructive'}`}>
          {formatCurrency(total)}
        </p>
      </div>
      <div className="mt-1 divide-y">
        {items.map((item) => (
          <ItemRow key={item.id} item={item} tipo={tipo} />
        ))}
      </div>
    </div>
  )
}

export function MonthDetailSheet({
  month,
  onOpenChange,
  isCurrentMonth,
  currentMonthTransactions,
  expenseCategories,
  incomeCategories,
  extraSaida,
}: MonthDetailSheetProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  let entradas: Item[] = []
  let saidas: Item[] = []

  if (month) {
    if (isCurrentMonth) {
      entradas = currentMonthTransactions
        .filter((t) => t.valor_entrada > 0)
        .map((t) => ({ id: t.id, nome: t.descricao, valor: t.valor_entrada }))
      saidas = currentMonthTransactions
        .filter((t) => t.valor_saida > 0)
        .map((t) => ({ id: t.id, nome: t.descricao, valor: t.valor_saida }))
    } else {
      entradas = incomeCategories
        .filter((c) => c.recorrencia === 'mensal')
        .map((c) => ({ id: c.id, nome: c.nome, valor: c.valor_mensal }))
      saidas = expenseCategoriesForMonth(expenseCategories, month.monthDate).map((c) => ({
        id: c.id,
        nome: c.nome,
        valor: c.valor_mensal,
      }))
      if (extraSaida) {
        saidas = [...saidas, { id: 'compra-simulada', nome: 'Compra simulada', valor: extraSaida }]
      }
    }
  }

  const isEmpty = entradas.length === 0 && saidas.length === 0

  const body = month && (
    <div className={cn('flex flex-col gap-5', !isDesktop && 'px-4 pb-6')}>
      <Badge variant="secondary" className="self-start">
        {isCurrentMonth ? 'Lançamentos reais deste mês' : 'Projeção com base nos fixos cadastrados'}
      </Badge>

      {isEmpty && (
        <p className="text-sm text-muted-foreground">Nada lançado nesse mês ainda.</p>
      )}

      <Section title="Entradas" items={entradas} tipo="entrada" total={month.totalEntradas} />
      <Section title="Saídas" items={saidas} tipo="saida" total={month.totalSaidas} />
    </div>
  )

  const title = month ? formatMonthLabel(month.monthDate) : ''

  if (isDesktop) {
    return (
      <Dialog open={!!month} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {body}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={!!month} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        {body}
      </SheetContent>
    </Sheet>
  )
}
