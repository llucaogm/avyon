import { useCountUp } from '@/shared/hooks/useCountUp'
import { formatCurrency } from '@/shared/lib/formatters'

/** A currency figure that ticks up/down to its new value instead of snapping —
 * used on the numbers people check first (dashboard totals, budget rows). */
export function AnimatedCurrency({ value, className }: { value: number; className?: string }) {
  const animated = useCountUp(value)
  return (
    <span className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {formatCurrency(animated)}
    </span>
  )
}
