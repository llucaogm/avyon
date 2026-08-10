import { useState } from 'react'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'
import { Button } from '@/shared/components/ui/button'
import { LoadingState } from '@/shared/components/common/LoadingState'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { useHabits, useUpdateHabit, useDeactivateHabit } from '@/modules/habitos/hooks/useHabits'
import { HabitFormDialog } from '@/modules/habitos/components/HabitFormDialog'
import { getHabitIcon } from '@/modules/habitos/lib/habitIcons'
import type { Tables } from '@/shared/types/database.types'

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function frequencyLabel(habit: Tables<'habits'>): string {
  if (habit.frequencia_tipo === 'diaria') return 'Todos os dias'
  const days = habit.dias_semana ?? []
  if (days.length === 0) return 'Nenhum dia selecionado'
  return days.map((d) => WEEKDAY_LABELS[d]).join(', ')
}

export function HabitsManageSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: habits = [], isLoading } = useHabits()
  const updateHabit = useUpdateHabit()
  const deactivateHabit = useDeactivateHabit()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Tables<'habits'> | undefined>()

  function swapOrder(a: Tables<'habits'>, b: Tables<'habits'>) {
    updateHabit.mutate({ id: a.id, values: { ordem: b.ordem } })
    updateHabit.mutate({ id: b.id, values: { ordem: a.ordem } })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Gerenciar hábitos</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-6">
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                setEditing(undefined)
                setDialogOpen(true)
              }}
            >
              <Plus className="size-4" />
              Novo hábito
            </Button>
          </div>

          {isLoading && <LoadingState />}

          {!isLoading && habits.length === 0 && (
            <EmptyState message="Nenhum hábito cadastrado ainda. Adicione o primeiro." />
          )}

          {habits.length > 0 && (
            <div className="flex flex-col divide-y">
              {habits.map((habit, index) => {
                const Icon = getHabitIcon(habit.icone)
                return (
                  <div key={habit.id} className="flex items-center gap-2 py-2">
                    <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
                      <Icon className="size-4" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{habit.nome}</p>
                      <p className="text-xs text-muted-foreground">{frequencyLabel(habit)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={index === 0}
                      onClick={() => swapOrder(habit, habits[index - 1])}
                    >
                      <ChevronUp className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={index === habits.length - 1}
                      onClick={() => swapOrder(habit, habits[index + 1])}
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(habit)
                        setDialogOpen(true)
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        deactivateHabit.mutate(habit.id, {
                          onError: () => toast.error('Não consegui excluir esse hábito'),
                        })
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <HabitFormDialog open={dialogOpen} onOpenChange={setDialogOpen} habit={editing} />
      </SheetContent>
    </Sheet>
  )
}
