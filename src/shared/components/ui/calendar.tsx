import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'
import { monthMatrix, isoDate, MONTHS, WEEKDAYS } from '@/shared/lib/calendarGrid'

interface CalendarProps {
  value?: string
  onSelect: (value: string) => void
  onClear?: () => void
}

function parseIso(value: string | undefined): { year: number; month: number } | null {
  if (!value) return null
  const [y, m] = value.split('-').map(Number)
  if (!y || !m) return null
  return { year: y, month: m - 1 }
}

/** Grade mensal própria (mesmo padrão de monthMatrix já usado no calendário
 * de Produção) — o <input type="date"> nativo não dá pra estilizar, o popup
 * dele é renderizado pelo SO/navegador, fora do alcance de qualquer CSS. */
export function Calendar({ value, onSelect, onClear }: CalendarProps) {
  const today = new Date()
  const initial = parseIso(value)
  const [viewYear, setViewYear] = useState(initial?.year ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(initial?.month ?? today.getMonth())

  const cells = monthMatrix(viewYear, viewMonth)
  const todayIso = isoDate(today.getFullYear(), today.getMonth(), today.getDate())

  function changeMonth(delta: number) {
    let m = viewMonth + delta
    let y = viewYear
    if (m < 0) {
      m = 11
      y -= 1
    } else if (m > 11) {
      m = 0
      y += 1
    }
    setViewMonth(m)
    setViewYear(y)
  }

  return (
    <div className="flex w-60 flex-col gap-3">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon-sm" onClick={() => changeMonth(-1)} aria-label="Mês anterior">
          <ChevronLeft className="size-4" />
        </Button>
        <span className="font-display text-sm font-semibold">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <Button variant="ghost" size="icon-sm" onClick={() => changeMonth(1)} aria-label="Próximo mês">
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="text-[10px] font-medium text-muted-foreground">
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const iso = isoDate(viewYear, viewMonth, day)
          const isSelected = iso === value
          const isToday = iso === todayIso
          return (
            <button
              type="button"
              key={i}
              onClick={() => onSelect(iso)}
              className={cn(
                'press-feedback mx-auto flex size-8 items-center justify-center rounded-full text-sm transition-colors hover:bg-muted',
                isSelected && 'bg-primary text-primary-foreground hover:bg-primary',
                !isSelected && isToday && 'font-semibold text-primary ring-1 ring-primary/40',
              )}
            >
              {day}
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between border-t pt-2 text-xs">
        {onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="press-feedback text-muted-foreground hover:text-foreground"
          >
            Limpar
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => onSelect(todayIso)}
          className="press-feedback font-medium text-primary hover:underline"
        >
          Hoje
        </button>
      </div>
    </div>
  )
}
