import { useMemo } from 'react'
import { format, subDays } from 'date-fns'
import type { Tables } from '@/shared/types/database.types'
import { HABIT_LOG_WINDOW_DAYS } from '@/modules/habitos/hooks/useHabitLogs'

export interface HeatmapDay {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

/**
 * Combined-effort heatmap data — habits done + água registrada + peso registrado,
 * per day, bucketed into 5 GitHub-style intensity levels. Purely derived from
 * logs already fetched elsewhere, never stored, same principle as
 * useHabitStreaks.ts / useMonthlyBudget.ts.
 */
export function useEffortHeatmap(
  habitLogs: Tables<'habit_logs'>[],
  aguaLogs: Tables<'agua_logs'>[],
  pesoLogs: Tables<'peso_logs'>[],
  days = HABIT_LOG_WINDOW_DAYS,
): HeatmapDay[] {
  return useMemo(() => {
    const habitCountByDay = new Map<string, number>()
    for (const log of habitLogs) {
      habitCountByDay.set(log.data, (habitCountByDay.get(log.data) ?? 0) + 1)
    }
    const aguaDays = new Set(aguaLogs.map((l) => l.data))
    const pesoDays = new Set(pesoLogs.map((l) => l.data))

    const today = new Date()
    const rows: { date: string; count: number }[] = []
    for (let i = days - 1; i >= 0; i--) {
      const iso = format(subDays(today, i), 'yyyy-MM-dd')
      const count = (habitCountByDay.get(iso) ?? 0) + (aguaDays.has(iso) ? 1 : 0) + (pesoDays.has(iso) ? 1 : 0)
      rows.push({ date: iso, count })
    }

    const max = Math.max(1, ...rows.map((r) => r.count))
    return rows.map((r) => ({
      date: r.date,
      count: r.count,
      level: (r.count === 0 ? 0 : Math.min(4, Math.ceil((r.count / max) * 4))) as HeatmapDay['level'],
    }))
  }, [habitLogs, aguaLogs, pesoLogs, days])
}
