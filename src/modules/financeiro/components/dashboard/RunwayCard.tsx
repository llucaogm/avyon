import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Progress } from '@/shared/components/ui/progress'
import { useFinancialRunway } from '@/modules/financeiro/hooks/useFinancialRunway'

export function RunwayCard({ saldoAtual }: { saldoAtual: number }) {
  const { progressoBateria, meses, dias } = useFinancialRunway(saldoAtual)

  return (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <CardTitle className="font-display text-base">Independência financeira</CardTitle>
        <p className="text-xs text-muted-foreground">
          Quanto tempo seu patrimônio + reserva sustentam seu custo de vida essencial.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="font-display text-2xl font-semibold">
          {meses} {meses === 1 ? 'mês' : 'meses'} e {dias} {dias === 1 ? 'dia' : 'dias'}
        </p>
        <Progress value={progressoBateria * 100} className="[&>div]:bg-group-reserva" />
      </CardContent>
    </Card>
  )
}
