import { useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { Calendar } from '@/shared/components/ui/calendar'
import { formatDate } from '@/shared/lib/formatters'
import { cn } from '@/shared/lib/utils'

interface DatePickerProps {
  id?: string
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  /** Mostra o link "Limpar" no calendário, pra campos de data opcionais. */
  clearable?: boolean
  className?: string
}

/** Substitui <input type="date"> — o calendário nativo é renderizado pelo
 * SO/navegador e não tem como estilizar (por isso destoava do resto do app). */
export function DatePicker({ id, value, onChange, placeholder = 'Selecione', clearable, className }: DatePickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          className={cn(
            'flex h-8 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1 text-left text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          {value ? formatDate(value) : placeholder}
          <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start">
        <Calendar
          value={value}
          onSelect={(v) => {
            onChange(v)
            setOpen(false)
          }}
          onClear={
            clearable
              ? () => {
                  onChange('')
                  setOpen(false)
                }
              : undefined
          }
        />
      </PopoverContent>
    </Popover>
  )
}
