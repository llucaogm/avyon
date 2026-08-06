import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { CategoriaBreakdownItem } from '@/modules/financeiro/hooks/useCategoriaBreakdown'
import { formatCurrency } from '@/shared/lib/formatters'

export function CategoriaDonutChart({
  items,
  total,
}: {
  items: CategoriaBreakdownItem[]
  total: number
}) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhum lançamento categorizado neste mês.
      </p>
    )
  }

  return (
    <div className="relative h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={items}
            dataKey="total"
            nameKey="nome"
            innerRadius="62%"
            outerRadius="90%"
            paddingAngle={2}
            stroke="none"
          >
            {items.map((item) => (
              <Cell key={item.categoriaId ?? 'sem-categoria'} fill={item.cor} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => formatCurrency(Number(v))} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-lg font-semibold">{formatCurrency(total)}</span>
        <span className="text-xs text-muted-foreground">total</span>
      </div>
    </div>
  )
}
