import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useMonth } from '@/modules/financeiro/context/MonthProvider'
import { formatMonthLabel } from '@/shared/lib/formatters'

export function MonthSwitcher() {
  const { selectedMonth, goToPreviousMonth, goToNextMonth } = useMonth()

  return (
    <div className="flex items-center justify-center gap-2">
      <Button variant="ghost" size="icon" onClick={goToPreviousMonth} aria-label="Mês anterior">
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-[10ch] text-center text-sm font-medium">
        {formatMonthLabel(selectedMonth)}
      </span>
      <Button variant="ghost" size="icon" onClick={goToNextMonth} aria-label="Próximo mês">
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}
