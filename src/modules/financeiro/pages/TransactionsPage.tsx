import { useMemo, useState, type CSSProperties } from 'react'
import { Trash2, Pencil, ArrowDownCircle, ArrowUpCircle, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { MonthSwitcher } from '@/modules/financeiro/components/layout/MonthSwitcher'
import { AnimatedCurrency } from '@/modules/financeiro/components/common/AnimatedCurrency'
import { QuickAddSheet } from '@/modules/financeiro/components/transactions/QuickAddSheet'
import { ImportStatementSheet } from '@/modules/financeiro/components/transactions/ImportStatementSheet'
import { useMonth } from '@/modules/financeiro/context/MonthProvider'
import { useMonthTransactions, useDeleteTransaction } from '@/modules/financeiro/hooks/useTransactions'
import { useExpenseCategories, useIncomeCategories } from '@/modules/financeiro/hooks/useCategories'
import { useCategorias } from '@/modules/financeiro/hooks/useCategorias'
import { formatCurrency, formatDate } from '@/shared/lib/formatters'
import { LoadingState } from '@/shared/components/common/LoadingState'
import { EmptyState } from '@/shared/components/common/EmptyState'
import type { Tables } from '@/shared/types/database.types'

export default function TransactionsPage() {
  const { selectedMonth } = useMonth()
  const { data: transactions = [], isLoading } = useMonthTransactions(selectedMonth)
  const { data: expenseCategories = [] } = useExpenseCategories()
  const { data: incomeCategories = [] } = useIncomeCategories()
  const { data: categoriasDespesa = [] } = useCategorias('despesa')
  const { data: categoriasReceita = [] } = useCategorias('receita')
  const deleteTransaction = useDeleteTransaction()
  const [editingTransaction, setEditingTransaction] = useState<Tables<'transactions'> | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of expenseCategories) map.set(c.id, c.nome)
    for (const c of incomeCategories) map.set(c.id, c.nome)
    return map
  }, [expenseCategories, incomeCategories])

  const categoriaById = useMemo(() => {
    const map = new Map<string, { nome: string; cor: string }>()
    for (const c of [...categoriasDespesa, ...categoriasReceita]) map.set(c.id, { nome: c.nome, cor: c.cor })
    return map
  }, [categoriasDespesa, categoriasReceita])

  const totals = useMemo(() => {
    const entradas = transactions.reduce((sum, t) => sum + t.valor_entrada, 0)
    const saidas = transactions.reduce((sum, t) => sum + t.valor_saida, 0)
    return { entradas, saidas, saldo: entradas - saidas }
  }, [transactions])

  const groupedByDay = useMemo(() => {
    const groups = new Map<string, typeof transactions>()
    for (const t of transactions) {
      const key = t.data
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(t)
    }
    return [...groups.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [transactions])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Lançamentos</h1>
          <MonthSwitcher />
        </div>
        <Button variant="outline" size="icon" aria-label="Importar extrato" onClick={() => setImportOpen(true)}>
          <Upload className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Card className="animate-fade-in-up" style={{ '--stagger-index': 0 } as CSSProperties}>
          <CardContent className="flex flex-col items-center gap-1 py-4">
            <span className="text-xs text-muted-foreground">Entradas</span>
            <AnimatedCurrency value={totals.entradas} className="font-display text-sm font-semibold text-primary" />
          </CardContent>
        </Card>
        <Card className="animate-fade-in-up" style={{ '--stagger-index': 1 } as CSSProperties}>
          <CardContent className="flex flex-col items-center gap-1 py-4">
            <span className="text-xs text-muted-foreground">Saídas</span>
            <AnimatedCurrency value={totals.saidas} className="font-display text-sm font-semibold text-destructive" />
          </CardContent>
        </Card>
        <Card className="animate-fade-in-up" style={{ '--stagger-index': 2 } as CSSProperties}>
          <CardContent className="flex flex-col items-center gap-1 py-4">
            <span className="text-xs text-muted-foreground">Saldo</span>
            <AnimatedCurrency value={totals.saldo} className="font-display text-sm font-semibold" />
          </CardContent>
        </Card>
      </div>

      {isLoading && <LoadingState />}

      {!isLoading && transactions.length === 0 && (
        <EmptyState message="Nenhum lançamento neste mês. Toque no botão + para adicionar." />
      )}

      {groupedByDay.map(([day, items], dayIndex) => (
        <div
          key={day}
          className="animate-fade-in-up flex flex-col gap-2"
          style={{ '--stagger-index': dayIndex } as CSSProperties}
        >
          <p className="text-xs font-medium text-muted-foreground">{formatDate(day)}</p>
          <Card>
            <CardContent className="flex flex-col divide-y p-0">
              {items.map((t) => {
                const isEntrada = t.valor_entrada > 0
                const categoryName = t.expense_category_id
                  ? categoryNameById.get(t.expense_category_id)
                  : t.income_category_id
                    ? categoryNameById.get(t.income_category_id)
                    : null
                const categoria = t.categoria_id ? categoriaById.get(t.categoria_id) : null
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-2 p-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-3">
                      {isEntrada ? (
                        <ArrowUpCircle className="size-5 shrink-0 text-primary" />
                      ) : (
                        <ArrowDownCircle className="size-5 shrink-0 text-destructive" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{t.descricao}</p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          {categoryName ?? 'Sem categoria'}
                          {t.forma_pagamento ? ` · ${t.forma_pagamento}` : ''}
                          {categoria && (
                            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5">
                              <span className="size-1.5 rounded-full" style={{ backgroundColor: categoria.cor }} />
                              {categoria.nome}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${isEntrada ? 'text-primary' : 'text-destructive'}`}>
                        {isEntrada ? '+' : '-'}
                        {formatCurrency(isEntrada ? t.valor_entrada : t.valor_saida)}
                      </span>
                      <Button variant="ghost" size="icon" onClick={() => setEditingTransaction(t)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          deleteTransaction.mutate(t.id, {
                            onError: () => toast.error('Não consegui excluir esse lançamento'),
                          })
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      ))}

      <QuickAddSheet
        open={!!editingTransaction}
        onOpenChange={(v) => !v && setEditingTransaction(null)}
        transaction={editingTransaction ?? undefined}
      />
      <ImportStatementSheet open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}
