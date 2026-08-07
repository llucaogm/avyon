import { addDays, addMonths, isSameDay, parseISO, setDate, startOfDay } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { LoadingState } from '@/shared/components/common/LoadingState'
import { useExpenseCategories } from '@/modules/financeiro/hooks/useCategories'
import { formatCurrency } from '@/shared/lib/formatters'
import type { Tables } from '@/shared/types/database.types'

interface DueItem {
  id: string
  nome: string
  valor: number
  data: Date
}

const weekdayFormatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })

/** Only categories with a knowable exact date qualify — mensal without dia_vencimento
 * and anual/semestral (which only have a due *month*) are deliberately excluded rather
 * than guessed at. */
function nextOccurrence(category: Tables<'expense_categories'>, hoje: Date): Date | null {
  if (category.frequencia === 'mensal' && category.dia_vencimento) {
    const thisMonth = setDate(hoje, category.dia_vencimento)
    return thisMonth < hoje ? setDate(addMonths(hoje, 1), category.dia_vencimento) : thisMonth
  }
  if (category.frequencia === 'unico' && category.charge_date) {
    return parseISO(category.charge_date)
  }
  return null
}

function relativeLabel(date: Date, hoje: Date): string {
  if (isSameDay(date, hoje)) return 'Hoje'
  if (isSameDay(date, addDays(hoje, 1))) return 'Amanhã'
  const label = weekdayFormatter.format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function UpcomingDueList() {
  const { data: categories = [], isLoading } = useExpenseCategories()
  const hoje = startOfDay(new Date())
  const janela = addDays(hoje, 7)

  const items: DueItem[] = categories
    .map((c) => {
      const data = nextOccurrence(c, hoje)
      return data && data >= hoje && data <= janela ? { id: c.id, nome: c.nome, valor: c.valor_mensal, data } : null
    })
    .filter((item): item is DueItem => item !== null)
    .sort((a, b) => a.data.getTime() - b.data.getTime())

  return (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <CardTitle className="font-display text-base">Vencimentos da semana</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col divide-y p-0">
        {isLoading && (
          <div className="p-3">
            <LoadingState rows={2} />
          </div>
        )}
        {!isLoading && items.length === 0 && (
          <div className="p-3">
            <EmptyState message="Nenhum vencimento com data exata nos próximos 7 dias." />
          </div>
        )}
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 text-sm">
            <div>
              <p className="font-medium">{item.nome}</p>
              <p className="text-xs text-muted-foreground">{relativeLabel(item.data, hoje)}</p>
            </div>
            <span className="font-medium text-destructive">{formatCurrency(item.valor)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
