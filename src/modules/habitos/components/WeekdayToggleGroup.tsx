import { ToggleGroup, ToggleGroupItem } from '@/shared/components/ui/toggle-group'

const WEEKDAYS = [
  { value: 0, label: 'D' },
  { value: 1, label: 'S' },
  { value: 2, label: 'T' },
  { value: 3, label: 'Q' },
  { value: 4, label: 'Q' },
  { value: 5, label: 'S' },
  { value: 6, label: 'S' },
]

export function WeekdayToggleGroup({
  value,
  onChange,
}: {
  value: number[]
  onChange: (days: number[]) => void
}) {
  return (
    <ToggleGroup
      type="multiple"
      variant="outline"
      value={value.map(String)}
      onValueChange={(next: string[]) => onChange(next.map(Number).sort())}
    >
      {WEEKDAYS.map(({ value: day, label }) => (
        <ToggleGroupItem key={day} value={String(day)} aria-label={`Dia ${day}`} className="size-9">
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
