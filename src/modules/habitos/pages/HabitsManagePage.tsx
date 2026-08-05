import { useState } from 'react'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/shared/components/ui/card'
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

export default function HabitsManagePage() {
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
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <h1 className="font-display text-2xl font-semibold">Gerenciar hábitos</h1>
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
        <Card>
          <CardContent className="flex flex-col divide-y p-0">
            {habits.map((habit, index) => {
              const Icon = getHabitIcon(habit.icone)
              return (
                <div key={habit.id} className="flex items-center gap-3 p-3">
                  <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
                    <Icon className="size-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{habit.nome}</p>
                    <p className="text-xs text-muted-foreground">{frequencyLabel(habit)}</p>
                  </div>
                  <div className="flex gap-1">
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
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      <HabitFormDialog open={dialogOpen} onOpenChange={setDialogOpen} habit={editing} />
    </div>
  )
}
