import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { GroupBudget } from '@/modules/financeiro/hooks/useMonthlyBudget'
import { formatCurrency } from '@/shared/lib/formatters'
import { CATEGORY_GROUP_LABELS } from '@/modules/financeiro/lib/categoryGroups'

export function GroupBreakdownChart({ data }: { data: GroupBudget[] }) {
  const chartData = data
    .filter((d) => d.previsto > 0 || d.realizado > 0)
    .map((d) => ({
      grupo: CATEGORY_GROUP_LABELS[d.grupo],
      Previsto: d.previsto,
      Realizado: d.realizado,
    }))

  if (chartData.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Cadastre categorias para ver o gráfico de previsto x realizado.
      </p>
    )
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
          <XAxis dataKey="grupo" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={12}
            tickFormatter={(v) => formatCurrency(v)}
            width={80}
          />
          <Tooltip formatter={(v) => formatCurrency(Number(v))} />
          <Legend />
          <Bar dataKey="Previsto" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Realizado" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
