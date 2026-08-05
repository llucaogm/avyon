import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { FormField } from '@/shared/components/common/FormField'
import { SubmitButton } from '@/shared/components/common/SubmitButton'
import { WeekdayToggleGroup } from '@/modules/habitos/components/WeekdayToggleGroup'
import { HABIT_ICON_NAMES, getHabitIcon } from '@/modules/habitos/lib/habitIcons'
import { useCreateHabit, useUpdateHabit } from '@/modules/habitos/hooks/useHabits'
import { getErrorMessage } from '@/shared/lib/errors'
import type { Tables } from '@/shared/types/database.types'

const schema = z.object({
  nome: z.string().min(1, 'Informe um nome'),
  icone: z.string(),
  frequencia_tipo: z.enum(['diaria', 'dias_da_semana']),
  dias_semana: z.array(z.number()),
})

type FormValues = z.infer<typeof schema>

interface HabitFormDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  habit?: Tables<'habits'>
}

export function HabitFormDialog({ open, onOpenChange, habit }: HabitFormDialogProps) {
  const createHabit = useCreateHabit()
  const updateHabit = useUpdateHabit()
  const isEditing = !!habit

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '',
      icone: HABIT_ICON_NAMES[0],
      frequencia_tipo: 'diaria',
      dias_semana: [],
    },
  })

  const frequenciaTipo = watch('frequencia_tipo')

  useEffect(() => {
    if (open) {
      reset(
        habit
          ? {
              nome: habit.nome,
              icone: habit.icone ?? HABIT_ICON_NAMES[0],
              frequencia_tipo: habit.frequencia_tipo,
              dias_semana: habit.dias_semana ?? [],
            }
          : { nome: '', icone: HABIT_ICON_NAMES[0], frequencia_tipo: 'diaria', dias_semana: [] },
      )
    }
  }, [open, habit, reset])

  async function onSubmit(values: FormValues) {
    try {
      const payload = {
        nome: values.nome,
        icone: values.icone,
        frequencia_tipo: values.frequencia_tipo,
        dias_semana: values.frequencia_tipo === 'dias_da_semana' ? values.dias_semana : null,
      }
      if (isEditing) {
        await updateHabit.mutateAsync({ id: habit.id, values: payload })
        toast.success('Hábito atualizado')
      } else {
        await createHabit.mutateAsync(payload)
        toast.success('Hábito criado')
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao salvar hábito'))
    }
  }

  const isSubmitting = createHabit.isPending || updateHabit.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar hábito' : 'Novo hábito'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField label="Nome" htmlFor="nome" error={errors.nome?.message}>
            <Input id="nome" {...register('nome')} />
          </FormField>

          <FormField label="Ícone" htmlFor="icone">
            <Controller
              control={control}
              name="icone"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="icone" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HABIT_ICON_NAMES.map((name) => {
                      const Icon = getHabitIcon(name)
                      return (
                        <SelectItem key={name} value={name}>
                          <Icon className="size-4" />
                          {name}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField label="Frequência" htmlFor="frequencia_tipo">
            <Controller
              control={control}
              name="frequencia_tipo"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="frequencia_tipo" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diaria">Todos os dias</SelectItem>
                    <SelectItem value="dias_da_semana">Dias específicos</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          {frequenciaTipo === 'dias_da_semana' && (
            <FormField label="Quais dias" htmlFor="dias_semana">
              <Controller
                control={control}
                name="dias_semana"
                render={({ field }) => (
                  <WeekdayToggleGroup value={field.value} onChange={field.onChange} />
                )}
              />
            </FormField>
          )}

          <DialogFooter>
            <SubmitButton pending={isSubmitting}>Salvar</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
