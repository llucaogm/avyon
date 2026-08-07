import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { formatCurrency } from '@/shared/lib/formatters'

interface CashFlowCardProps {
  comprometido: number
  investido: number
  livre: number
}

export function CashFlowCard({ comprometido, investido, livre }: CashFlowCardProps) {
  return (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <CardTitle className="font-display text-base">Fluxo de caixa livre</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-2">
        <Stat label="Comprometido" value={comprometido} />
        <Stat label="Investido" value={investido} />
        <Stat label="Livre" value={livre} tone={livre < 0 ? 'negative' : 'positive'} />
      </CardContent>
    </Card>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'positive' | 'negative' }) {
  const color = tone === 'negative' ? 'text-destructive' : tone === 'positive' ? 'text-primary' : ''
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-display text-sm font-semibold ${color}`}>{formatCurrency(value)}</p>
    </div>
  )
}
