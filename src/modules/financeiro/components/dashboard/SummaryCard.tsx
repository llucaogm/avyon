import type { CSSProperties } from 'react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { AnimatedCurrency } from '@/modules/financeiro/components/common/AnimatedCurrency'
import { cn } from '@/shared/lib/utils'

export type SummaryCardTone = 'default' | 'positive' | 'negative'

export interface SummaryCardProps {
  label: string
  value: number
  tone?: SummaryCardTone
  caption?: string
  /** Position in a stagger group — feeds the entrance-animation delay. */
  index?: number
}

export function SummaryCard({ label, value, tone = 'default', caption, index = 0 }: SummaryCardProps) {
  return (
    <Card
      className="animate-fade-in-up lift-on-hover"
      style={{ '--stagger-index': index } as CSSProperties}
    >
      <CardContent className="flex flex-col gap-1 py-4">
        <span className="text-xs text-muted-foreground">{label}</span>
        <AnimatedCurrency
          value={value}
          className={cn(
            'font-display text-lg font-semibold',
            tone === 'positive' && 'text-primary',
            tone === 'negative' && 'text-destructive',
          )}
        />
        {caption && <span className="text-[11px] text-muted-foreground">{caption}</span>}
      </CardContent>
    </Card>
  )
}
