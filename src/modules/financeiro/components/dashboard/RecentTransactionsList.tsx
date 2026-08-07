import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { LoadingState } from '@/shared/components/common/LoadingState'
import { useRecentTransactions } from '@/modules/financeiro/hooks/useTransactions'
import { formatCurrency, formatDate } from '@/shared/lib/formatters'

export function RecentTransactionsList() {
  const { data: transactions = [], isLoading } = useRecentTransactions(5)

  return (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <CardTitle className="font-display text-base">Últimos lançamentos</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col divide-y p-0">
        {isLoading && (
          <div className="p-3">
            <LoadingState rows={3} />
          </div>
        )}
        {!isLoading && transactions.length === 0 && (
          <div className="p-3">
            <EmptyState message="Nenhum lançamento ainda." />
          </div>
        )}
        {transactions.map((t) => {
          const isEntrada = t.valor_entrada > 0
          return (
            <div key={t.id} className="flex items-center justify-between gap-2 p-3">
              <div className="flex items-center gap-3">
                {isEntrada ? (
                  <ArrowUpCircle className="size-5 shrink-0 text-primary" />
                ) : (
                  <ArrowDownCircle className="size-5 shrink-0 text-destructive" />
                )}
                <div>
                  <p className="text-sm font-medium">{t.descricao}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(t.data)}</p>
                </div>
              </div>
              <span className={`text-sm font-semibold ${isEntrada ? 'text-primary' : 'text-destructive'}`}>
                {isEntrada ? '+' : '-'}
                {formatCurrency(isEntrada ? t.valor_entrada : t.valor_saida)}
              </span>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
