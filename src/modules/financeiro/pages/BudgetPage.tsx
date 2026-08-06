import { useMemo, useRef, useState, type CSSProperties } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Progress } from '@/shared/components/ui/progress'
import { Button } from '@/shared/components/ui/button'
import { MonthSwitcher } from '@/modules/financeiro/components/layout/MonthSwitcher'
import { AnimatedCurrency } from '@/modules/financeiro/components/common/AnimatedCurrency'
import { ConfirmCheck } from '@/shared/components/common/ConfirmCheck'
import { useMonth } from '@/modules/financeiro/context/MonthProvider'
import { useMonthlyBudget, useMonthlyIncome } from '@/modules/financeiro/hooks/useMonthlyBudget'
import { useCategoryMonthStatus, useSetCategoryPago } from '@/modules/financeiro/hooks/useCategoryMonthStatus'
import { useCreateTransaction } from '@/modules/financeiro/hooks/useTransactions'
import { formatCurrency } from '@/shared/lib/formatters'
import { monthKey, todayIso } from '@/modules/financeiro/lib/monthUtils'
import { CATEGORY_GROUP_LABELS, CATEGORY_GROUP_ORDER, CATEGORY_GROUP_ACCENT } from '@/modules/financeiro/lib/categoryGroups'
import { getErrorMessage } from '@/shared/lib/errors'
import { LoadingState } from '@/shared/components/common/LoadingState'
import { EmptyState } from '@/shared/components/common/EmptyState'

export default function BudgetPage() {
  const { selectedMonth } = useMonth()
  const { perCategory, perGroup, totals, isLoading } = useMonthlyBudget(selectedMonth)
  const { perCategory: incomeItems, isLoading: loadingIncome } = useMonthlyIncome(selectedMonth)
  const { data: statuses = [] } = useCategoryMonthStatus(selectedMonth)
  const setPago = useSetCategoryPago(selectedMonth)
  const createTransaction = useCreateTransaction()
  const [justConfirmed, setJustConfirmed] = useState<Set<string>>(new Set())
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const pagoByCategory = useMemo(() => {
    const map = new Map<string, boolean>()
    for (const s of statuses) map.set(s.category_id, s.pago)
    return map
  }, [statuses])

  const isCurrentMonth = monthKey(selectedMonth) === monthKey(new Date())

  function playConfirmMoment(categoryId: string) {
    setJustConfirmed((prev) => new Set(prev).add(categoryId))
    const existing = timers.current.get(categoryId)
    if (existing) clearTimeout(existing)
    timers.current.set(
      categoryId,
      setTimeout(() => {
        setJustConfirmed((prev) => {
          const next = new Set(prev)
          next.delete(categoryId)
          return next
        })
      }, 900),
    )
  }

  /** Powers both "Confirmar pagamento" (despesa) and "Confirmar recebimento" (receita) —
   * same one-click log-and-optionally-mark-paid flow, just mirrored entrada/saída. */
  async function confirmarLancamento(opts: {
    tipo: 'saida' | 'entrada'
    categoryId: string
    categoriaId: string | null
    nome: string
    valor: number
  }) {
    try {
      await createTransaction.mutateAsync({
        data: isCurrentMonth ? todayIso() : monthKey(selectedMonth),
        descricao: opts.nome,
        valor_saida: opts.tipo === 'saida' ? opts.valor : 0,
        valor_entrada: opts.tipo === 'entrada' ? opts.valor : 0,
        expense_category_id: opts.tipo === 'saida' ? opts.categoryId : null,
        income_category_id: opts.tipo === 'entrada' ? opts.categoryId : null,
        categoria_id: opts.categoriaId,
      })
      if (opts.tipo === 'saida') {
        setPago.mutate(
          { categoryId: opts.categoryId, pago: true },
          { onError: () => toast.error('Pagamento lançado, mas não consegui marcar como pago') },
        )
      }
      playConfirmMoment(opts.categoryId)
      toast.success(opts.tipo === 'saida' ? 'Pagamento lançado' : 'Recebimento lançado')
    } catch (err) {
      toast.error(
        getErrorMessage(err, opts.tipo === 'saida' ? 'Erro ao lançar pagamento' : 'Erro ao lançar recebimento'),
      )
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Orçamento do mês</h1>
        <MonthSwitcher />
      </div>

      {!loadingIncome && incomeItems.length > 0 && (
        <Card className="animate-fade-in-up">
          <CardHeader>
            <CardTitle className="text-base">Receitas do mês</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y p-0">
            {incomeItems.map((c) => {
              const confirmed = justConfirmed.has(c.categoryId)
              return (
                <div
                  key={c.categoryId}
                  className={confirmed ? 'animate-wash' : undefined}
                  style={{ '--wash-color': 'var(--primary)' } as CSSProperties}
                >
                  <div className="flex flex-col gap-2 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{c.nome}</span>
                      <span className="text-sm text-muted-foreground">
                        {c.previsto > 0 ? (
                          <>
                            <AnimatedCurrency value={c.recebido} /> / {formatCurrency(c.previsto)}
                          </>
                        ) : (
                          <AnimatedCurrency value={c.recebido} />
                        )}
                      </span>
                    </div>
                    {c.recorrencia === 'mensal' && c.previsto > 0 && c.recebido === 0 && !confirmed && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="self-start"
                        disabled={createTransaction.isPending}
                        onClick={() =>
                          confirmarLancamento({
                            tipo: 'entrada',
                            categoryId: c.categoryId,
                            categoriaId: c.categoriaId,
                            nome: c.nome,
                            valor: c.previsto,
                          })
                        }
                      >
                        <CheckCircle2 className="size-4" />
                        Confirmar recebimento ({formatCurrency(c.previsto)})
                      </Button>
                    )}
                    {confirmed && (
                      <div className="flex items-center gap-2">
                        <ConfirmCheck color="var(--primary)" />
                        <span className="text-sm text-primary">Recebido</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {isLoading && <LoadingState />}

      {!isLoading && perCategory.length === 0 && (
        <EmptyState message="Cadastre categorias de despesa para acompanhar o orçamento." />
      )}

      {CATEGORY_GROUP_ORDER.map((grupo, groupIndex) => {
        const items = perCategory.filter((c) => c.grupo === grupo)
        if (items.length === 0) return null
        const group = perGroup.find((g) => g.grupo === grupo)!
        const accent = CATEGORY_GROUP_ACCENT[grupo]
        return (
          <Card
            key={grupo}
            className="animate-fade-in-up border-l-2"
            style={{ '--stagger-index': groupIndex, borderLeftColor: accent } as CSSProperties}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{CATEGORY_GROUP_LABELS[grupo]}</CardTitle>
              <span className="text-xs text-muted-foreground">
                {formatCurrency(group.realizado)} / {formatCurrency(group.previsto)}
              </span>
            </CardHeader>
            <CardContent className="flex flex-col divide-y p-0">
              {items.map((c) => {
                const pct = c.previsto > 0 ? Math.min(c.realizado / c.previsto, 1) : 0
                const acima = c.previsto > 0 && c.realizado > c.previsto
                const confirmed = justConfirmed.has(c.categoryId)
                return (
                  <div
                    key={c.categoryId}
                    className={confirmed ? 'animate-wash' : undefined}
                    style={{ '--wash-color': accent } as CSSProperties}
                  >
                    <div className="flex flex-col gap-2 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={pagoByCategory.get(c.categoryId) ?? false}
                            onCheckedChange={(checked) =>
                              setPago.mutate(
                                { categoryId: c.categoryId, pago: checked === true },
                                { onError: () => toast.error('Não consegui salvar essa marcação') },
                              )
                            }
                          />
                          <span className="text-sm font-medium">{c.nome}</span>
                        </div>
                        <span className={`text-sm ${acima ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {c.previsto > 0 ? (
                            <>
                              <AnimatedCurrency value={c.realizado} /> / {formatCurrency(c.previsto)}
                            </>
                          ) : (
                            <AnimatedCurrency value={c.realizado} />
                          )}
                        </span>
                      </div>
                      {c.previsto > 0 ? (
                        <Progress
                          value={pct * 100}
                          className={acima ? '[&>div]:bg-destructive' : '[&>div]:bg-[var(--bar-accent)]'}
                          style={{ '--bar-accent': accent } as CSSProperties}
                        />
                      ) : (
                        <p className="text-xs text-muted-foreground">Sem orçamento definido para esta categoria</p>
                      )}
                      {c.frequencia === 'mensal' && c.previsto > 0 && c.realizado === 0 && !confirmed && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="self-start"
                          disabled={createTransaction.isPending}
                          onClick={() =>
                            confirmarLancamento({
                              tipo: 'saida',
                              categoryId: c.categoryId,
                              categoriaId: c.categoriaId,
                              nome: c.nome,
                              valor: c.previsto,
                            })
                          }
                        >
                          <CheckCircle2 className="size-4" />
                          Confirmar pagamento ({formatCurrency(c.previsto)})
                        </Button>
                      )}
                      {confirmed && (
                        <div className="flex items-center gap-2">
                          <ConfirmCheck color={accent} />
                          <span className="text-sm" style={{ color: accent }}>
                            Pago
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )
      })}

      {perCategory.length > 0 && (
        <Card className="animate-fade-in-up">
          <CardHeader>
            <CardTitle className="text-base">Total geral</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-sm font-medium">
            <span>Realizado / Previsto</span>
            <span className={totals.realizado > totals.previsto ? 'text-destructive' : ''}>
              <AnimatedCurrency value={totals.realizado} /> / {formatCurrency(totals.previsto)}
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
