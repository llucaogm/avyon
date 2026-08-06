import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { LoadingState } from '@/shared/components/common/LoadingState'
import { useHabitLogs } from '@/modules/habitos/hooks/useHabitLogs'
import { useAguaLogs } from '@/modules/habitos/hooks/useAgua'
import { usePesoLogs } from '@/modules/habitos/hooks/usePeso'
import { useEffortHeatmap } from '@/modules/habitos/hooks/useEffortHeatmap'
import { HabitHeatmap } from '@/modules/habitos/components/HabitHeatmap'

export function MapaTab() {
  const { data: habitLogs = [], isLoading: loadingHabits } = useHabitLogs()
  const { data: aguaLogs = [], isLoading: loadingAgua } = useAguaLogs()
  const { data: pesoLogs = [], isLoading: loadingPeso } = usePesoLogs()
  const heatmap = useEffortHeatmap(habitLogs, aguaLogs, pesoLogs)

  const isLoading = loadingHabits || loadingAgua || loadingPeso

  return (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <CardTitle className="font-display text-base">Evolução do esforço</CardTitle>
        <p className="text-xs text-muted-foreground">
          Hábitos concluídos, água e peso registrados nos últimos 90 dias, combinados num só mapa.
        </p>
      </CardHeader>
      <CardContent>{isLoading ? <LoadingState rows={1} /> : <HabitHeatmap days={heatmap} />}</CardContent>
    </Card>
  )
}
