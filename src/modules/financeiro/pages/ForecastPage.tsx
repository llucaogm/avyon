import { useMemo } from 'react'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { useExpenseCategories, useIncomeCategories } from '@/modules/financeiro/hooks/useCategories'
import { useAppSettings } from '@/modules/financeiro/hooks/useAppSettings'
import { computeForecast } from '@/modules/financeiro/lib/forecast'
import { formatCurrency, formatMonthLabel } from '@/shared/lib/formatters'
import { LoadingState } from '@/shared/components/common/LoadingState'

export default function ForecastPage() {
  const { data: expenseCategories = [], isLoading: loadingExpense } = useExpenseCategories()
  const { data: incomeCategories = [], isLoading: loadingIncome } = useIncomeCategories()
  const { data: settings, isLoading: loadingSettings } = useAppSettings()

  const forecast = useMemo(() => {
    if (!settings) return []
    return computeForecast(expenseCategories, incomeCategories, settings.saldo_atual_conta, 12)
  }, [expenseCategories, incomeCategories, settings])

  const chartData = forecast.map((m) => ({
    mes: formatMonthLabel(m.monthDate),
    Saldo: m.saldoAcumulado,
  }))

  const isLoading = loadingExpense || loadingIncome || loadingSettings

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Projeção Futura</h1>
        <p className="text-sm text-muted-foreground">
          Próximos 12 meses, calculado a partir das categorias cadastradas e do saldo atual.
        </p>
      </div>

      {isLoading && <LoadingState />}

      {!isLoading && (
        <>
          <Card className="animate-fade-in-up">
            <CardHeader>
              <CardTitle className="font-display text-base">Saldo acumulado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                    <XAxis dataKey="mes" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis
                      tickFormatter={(v) => formatCurrency(v)}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={80}
                    />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Line type="monotone" dataKey="Saldo" stroke="var(--primary)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalhe mensal</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead className="text-right">Entradas</TableHead>
                    <TableHead className="text-right">Saídas</TableHead>
                    <TableHead className="text-right">Saldo acumulado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forecast.map((m) => (
                    <TableRow key={m.monthKey}>
                      <TableCell>{formatMonthLabel(m.monthDate)}</TableCell>
                      <TableCell className="text-right text-primary">
                        {formatCurrency(m.totalEntradas)}
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        {formatCurrency(m.totalSaidas)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${m.saldoAcumulado < 0 ? 'text-destructive' : ''}`}
                      >
                        {formatCurrency(m.saldoAcumulado)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
