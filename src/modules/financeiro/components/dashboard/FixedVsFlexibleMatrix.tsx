import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Progress } from '@/shared/components/ui/progress'
import { formatPercent } from '@/shared/lib/formatters'

export function FixedVsFlexibleMatrix({ percentualComprometido }: { percentualComprometido: number }) {
  const percentual = Math.min(Math.max(percentualComprometido, 0), 1)

  return (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <CardTitle className="font-display text-base">Renda comprometida</CardTitle>
        <p className="text-xs text-muted-foreground">
          Quanto da sua renda já está preso em custo fixo e investimentos travados.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p
          className={`font-display text-2xl font-semibold ${
            percentualComprometido > 0.5 ? 'text-destructive' : 'text-primary'
          }`}
        >
          {formatPercent(percentualComprometido)}
        </p>
        <Progress
          value={percentual * 100}
          className={percentualComprometido > 0.5 ? '[&>div]:bg-destructive' : '[&>div]:bg-primary'}
        />
      </CardContent>
    </Card>
  )
}
