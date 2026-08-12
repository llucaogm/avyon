import { useMemo, useState } from 'react'
import { LineChart, Line, Legend, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { FormField } from '@/shared/components/common/FormField'
import { useExpenseCategories, useIncomeCategories } from '@/modules/financeiro/hooks/useCategories'
import { useAppSettings } from '@/modules/financeiro/hooks/useAppSettings'
import { useMonthTransactions } from '@/modules/financeiro/hooks/useTransactions'
import { useSaldoGlobal } from '@/modules/financeiro/hooks/useCartoes'
import { computeForecast } from '@/modules/financeiro/lib/forecast'
import { formatCurrency, formatMonthLabel } from '@/shared/lib/formatters'
import { LoadingState } from '@/shared/components/common/LoadingState'

export default function ForecastPage() {
  const { data: expenseCategories = [], isLoading: loadingExpense } = useExpenseCategories()
  const { data: incomeCategories = [], isLoading: loadingIncome } = useIncomeCategories()
  const { data: settings, isLoading: loadingSettings } = useAppSettings()
  const { data: currentMonthTransactions = [], isLoading: loadingCurrentMonth } = useMonthTransactions(new Date())
  const { saldo: saldoAtual, isLoading: loadingSaldo } = useSaldoGlobal()

  const currentMonthActual = useMemo(
    () => ({
      entradas: currentMonthTransactions.reduce((sum, t) => sum + t.valor_entrada, 0),
      saidas: currentMonthTransactions.reduce((sum, t) => sum + t.valor_saida, 0),
    }),
    [currentMonthTransactions],
  )

  // saldoAtual already reflects this month's real transactions (via txSinceReconciliation),
  // so back them out here — computeForecast re-adds the full month via currentMonthActual.
  const saldoInicioMes = useMemo(
    () => saldoAtual - (currentMonthActual.entradas - currentMonthActual.saidas),
    [saldoAtual, currentMonthActual],
  )

  const forecast = useMemo(() => {
    if (!settings) return []
    return computeForecast(expenseCategories, incomeCategories, saldoInicioMes, 12, new Date(), currentMonthActual)
  }, [expenseCategories, incomeCategories, saldoInicioMes, currentMonthActual, settings])

  const [compraValor, setCompraValor] = useState('')
  const [compraParcelas, setCompraParcelas] = useState('1')
  const [compraMesIndex, setCompraMesIndex] = useState(0)

  const compraValorNum = Number(compraValor) || 0
  const parcelasNum = Math.max(1, Number(compraParcelas) || 1)
  const parcela = compraValorNum / parcelasNum
  const simulationActive = compraValorNum > 0

  const extraSaidas = useMemo(() => {
    if (!simulationActive) return undefined
    const arr = new Array(12).fill(0)
    for (let i = compraMesIndex; i < Math.min(12, compraMesIndex + parcelasNum); i++) {
      arr[i] = parcela
    }
    return arr
  }, [simulationActive, compraMesIndex, parcelasNum, parcela])

  const forecastComCompra = useMemo(() => {
    if (!settings || !extraSaidas) return forecast
    return computeForecast(
      expenseCategories,
      incomeCategories,
      saldoInicioMes,
      12,
      new Date(),
      currentMonthActual,
      extraSaidas,
    )
  }, [expenseCategories, incomeCategories, saldoInicioMes, currentMonthActual, settings, extraSaidas, forecast])

  const simulationSummary = useMemo(() => {
    if (!simulationActive || forecastComCompra.length === 0) return null
    let min = forecastComCompra[0].saldoAcumulado
    let minMonth = formatMonthLabel(forecastComCompra[0].monthDate)
    for (const m of forecastComCompra) {
      if (m.saldoAcumulado < min) {
        min = m.saldoAcumulado
        minMonth = formatMonthLabel(m.monthDate)
      }
    }
    return { min, minMonth }
  }, [simulationActive, forecastComCompra])

  const chartData = forecast.map((m, i) => ({
    mes: formatMonthLabel(m.monthDate),
    Saldo: m.saldoAcumulado,
    'Com a compra': forecastComCompra[i]?.saldoAcumulado ?? m.saldoAcumulado,
  }))

  const isLoading = loadingExpense || loadingIncome || loadingSettings || loadingCurrentMonth || loadingSaldo

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Projeção Futura</h1>
        <p className="text-sm text-muted-foreground">
          O mês atual mostra tudo que você já lançou (entradas e saídas reais); os próximos
          12 meses são projetados a partir das categorias fixas cadastradas.
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
                    {simulationActive && <Legend />}
                    <Line type="monotone" dataKey="Saldo" stroke="var(--primary)" strokeWidth={2} dot={false} />
                    {simulationActive && (
                      <Line
                        type="monotone"
                        dataKey="Com a compra"
                        stroke="var(--destructive)"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t pt-4">
                <div>
                  <h3 className="font-display text-sm font-semibold">Simular uma compra</h3>
                  <p className="text-xs text-muted-foreground">
                    Veja como fica a saúde financeira dos próximos 12 meses se você comprar algo agora.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <FormField label="Valor (R$)" htmlFor="compra-valor">
                    <Input
                      id="compra-valor"
                      type="number"
                      step="0.01"
                      min="0"
                      value={compraValor}
                      onChange={(e) => setCompraValor(e.target.value)}
                      placeholder="0,00"
                    />
                  </FormField>
                  <FormField label="Parcelas" htmlFor="compra-parcelas">
                    <Input
                      id="compra-parcelas"
                      type="number"
                      step="1"
                      min="1"
                      value={compraParcelas}
                      onChange={(e) => setCompraParcelas(e.target.value)}
                    />
                  </FormField>
                  <div className="col-span-2 sm:col-span-1">
                    <FormField label="A partir de" htmlFor="compra-mes">
                      <Select value={String(compraMesIndex)} onValueChange={(v) => setCompraMesIndex(Number(v))}>
                        <SelectTrigger id="compra-mes" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {forecast.map((m, i) => (
                            <SelectItem key={m.monthKey} value={String(i)}>
                              {formatMonthLabel(m.monthDate)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                  </div>
                </div>

                {simulationSummary && (
                  <div
                    className={`rounded-md border p-3 text-sm ${
                      simulationSummary.min < 0
                        ? 'border-destructive/50 bg-destructive/10 text-destructive'
                        : 'border-primary/50 bg-primary/10 text-primary'
                    }`}
                  >
                    {simulationSummary.min < 0
                      ? `Essa compra deixaria seu saldo negativo: mínimo projetado de ${formatCurrency(simulationSummary.min)} em ${simulationSummary.minMonth}.`
                      : `Seu saldo continua positivo com essa compra — mínimo projetado de ${formatCurrency(simulationSummary.min)} em ${simulationSummary.minMonth}.`}
                    {parcelasNum > 1 && ` Parcela de ${formatCurrency(parcela)}/mês.`}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalhe mensal</CardTitle>
              {simulationActive && (
                <p className="text-xs text-muted-foreground">
                  As colunas em itálico mostram como ficaria com a compra simulada.
                </p>
              )}
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead className="text-right">Entradas</TableHead>
                    <TableHead className="text-right">Saídas</TableHead>
                    {simulationActive && (
                      <TableHead className="text-right italic">Saídas c/ compra</TableHead>
                    )}
                    <TableHead className="text-right">Saldo acumulado</TableHead>
                    {simulationActive && (
                      <TableHead className="text-right italic">Saldo c/ compra</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forecast.map((m, i) => {
                    const sim = forecastComCompra[i]
                    return (
                      <TableRow key={m.monthKey}>
                        <TableCell>{formatMonthLabel(m.monthDate)}</TableCell>
                        <TableCell className="text-right text-primary">
                          {formatCurrency(m.totalEntradas)}
                        </TableCell>
                        <TableCell className="text-right text-destructive">
                          {formatCurrency(m.totalSaidas)}
                        </TableCell>
                        {simulationActive && (
                          <TableCell className="text-right italic text-destructive">
                            {formatCurrency(sim?.totalSaidas ?? m.totalSaidas)}
                          </TableCell>
                        )}
                        <TableCell
                          className={`text-right font-medium ${m.saldoAcumulado < 0 ? 'text-destructive' : ''}`}
                        >
                          {formatCurrency(m.saldoAcumulado)}
                        </TableCell>
                        {simulationActive && (
                          <TableCell
                            className={`text-right italic font-medium ${
                              (sim?.saldoAcumulado ?? m.saldoAcumulado) < 0 ? 'text-destructive' : ''
                            }`}
                          >
                            {formatCurrency(sim?.saldoAcumulado ?? m.saldoAcumulado)}
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
