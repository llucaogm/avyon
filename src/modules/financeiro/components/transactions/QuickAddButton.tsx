import { useState } from 'react'
import { Plus } from 'lucide-react'
import { QuickAddSheet } from '@/modules/financeiro/components/transactions/QuickAddSheet'

export function QuickAddButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Novo lançamento"
        className="fixed bottom-20 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 md:bottom-8 md:right-8"
      >
        <Plus className="size-6" />
      </button>
      <QuickAddSheet open={open} onOpenChange={setOpen} />
    </>
  )
}
