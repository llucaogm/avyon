import { format, parseISO } from 'date-fns'
import type { HeatmapDay } from '@/modules/habitos/hooks/useEffortHeatmap'

const LEVEL_MIX = ['0%', '25%', '45%', '65%', '90%']

function groupByWeek(days: HeatmapDay[]): (HeatmapDay | null)[][] {
  if (days.length === 0) return []
  const firstDow = parseISO(days[0].date).getDay()
  const padded: (HeatmapDay | null)[] = [...Array(firstDow).fill(null), ...days]
  const weeks: (HeatmapDay | null)[][] = []
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7))
  }
  return weeks
}

function cellColor(day: HeatmapDay | null): string {
  if (!day) return 'transparent'
  if (day.level === 0) return 'var(--muted)'
  return `color-mix(in oklab, var(--primary) ${LEVEL_MIX[day.level]}, var(--card))`
}

export function HabitHeatmap({ days }: { days: HeatmapDay[] }) {
  if (days.length === 0 || days.every((d) => d.count === 0)) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhuma atividade registrada ainda — marque um hábito, adicione água ou registre seu peso.
      </p>
    )
  }

  const weeks = groupByWeek(days)

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => (
                <div
                  key={di}
                  title={day ? `${format(parseISO(day.date), 'dd/MM')} — ${day.count} registro(s)` : undefined}
                  className="size-3 rounded-sm"
                  style={{ backgroundColor: cellColor(day) }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        Menos
        {LEVEL_MIX.map((mix, level) => (
          <span
            key={level}
            className="size-3 rounded-sm"
            style={{
              backgroundColor: level === 0 ? 'var(--muted)' : `color-mix(in oklab, var(--primary) ${mix}, var(--card))`,
            }}
          />
        ))}
        Mais
      </div>
    </div>
  )
}
