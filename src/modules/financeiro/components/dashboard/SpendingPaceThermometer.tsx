import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { useFinancialHealth } from '@/modules/financeiro/hooks/useFinancialHealth'
import { useSpendingPace } from '@/modules/financeiro/hooks/useSpendingPace'
import { formatCurrency } from '@/shared/lib/formatters'

export function SpendingPaceThermometer() {
  const { disponivelFlexivel, restanteFlexivel, isLoading } = useFinancialHealth(new Date())
  const { series, diaAtual, diasRestantes, tetoDiarioRecomendado } = useSpendingPace(
    disponivelFlexivel,
    restanteFlexivel,
  )

  return (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <CardTitle className="font-display text-base">Ritmo de gastos</CardTitle>
        <p className="text-xs text-muted-foreground">
          Quanto você pode gastar por dia até o fim do mês sem estourar o orçamento flexível.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Teto diário recomendado</p>
            <p
              className={`font-display text-xl font-semibold ${
                tetoDiarioRecomendado < 0 ? 'text-destructive' : ''
              }`}
            >
              {formatCurrency(tetoDiarioRecomendado)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Dias restantes no mês</p>
            <p className="font-display text-xl font-semibold">{diasRestantes}</p>
          </div>
        </div>

        {!isLoading && diaAtual > 1 && (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis
                  dataKey="dia"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: 'Dia do mês', position: 'insideBottom', offset: -4, fontSize: 11, fill: 'var(--muted-foreground)' }}
                />
                <YAxis
                  tickFormatter={(v) => formatCurrency(v)}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} labelFormatter={(d) => `Dia ${d}`} />
                <ReferenceLine x={diaAtual} stroke="var(--border)" label={{ value: 'Hoje', fontSize: 11, fill: 'var(--muted-foreground)', position: 'top' }} />
                <Line
                  type="monotone"
                  dataKey="real"
                  name="Saldo flexível"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="guia"
                  name="Ritmo ideal"
                  stroke="var(--muted-foreground)"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {!isLoading && diaAtual <= 1 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Ainda sem dados suficientes este mês para o gráfico.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
