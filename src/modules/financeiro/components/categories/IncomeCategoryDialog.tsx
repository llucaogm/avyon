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
import { useCreateIncomeCategory, useUpdateIncomeCategory } from '@/modules/financeiro/hooks/useCategories'
import { useCategorias } from '@/modules/financeiro/hooks/useCategorias'
import { getErrorMessage } from '@/shared/lib/errors'
import { FormField } from '@/shared/components/common/FormField'
import { SubmitButton } from '@/shared/components/common/SubmitButton'
import type { Tables } from '@/shared/types/database.types'

const schema = z.object({
  nome: z.string().min(1, 'Informe um nome'),
  valor_mensal: z.coerce.number().min(0, 'Não pode ser negativo'),
  recorrencia: z.enum(['mensal', 'anual', 'semestral', 'eventual']),
  categoria_id: z.string().optional(),
  observacao: z.string().optional(),
})

type FormInput = z.input<typeof schema>
type FormOutput = z.output<typeof schema>

const recurrenceLabels: Record<FormOutput['recorrencia'], string> = {
  mensal: 'Mensal',
  anual: 'Anual',
  semestral: 'Semestral',
  eventual: 'Eventual',
}

interface IncomeCategoryDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  category?: Tables<'income_categories'>
}

export function IncomeCategoryDialog({ open, onOpenChange, category }: IncomeCategoryDialogProps) {
  const createCategory = useCreateIncomeCategory()
  const updateCategory = useUpdateIncomeCategory()
  const { data: categorias = [] } = useCategorias('receita')
  const isEditing = !!category

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<
    FormInput,
    unknown,
    FormOutput
  >({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', valor_mensal: 0, recorrencia: 'mensal', categoria_id: undefined, observacao: '' },
  })

  useEffect(() => {
    if (open) {
      reset(
        category
          ? {
              nome: category.nome,
              valor_mensal: category.valor_mensal,
              recorrencia: category.recorrencia,
              categoria_id: category.categoria_id ?? undefined,
              observacao: category.observacao ?? '',
            }
          : { nome: '', valor_mensal: 0, recorrencia: 'mensal', categoria_id: undefined, observacao: '' },
      )
    }
  }, [open, category, reset])

  async function onSubmit(values: FormOutput) {
    try {
      const payload = {
        nome: values.nome,
        valor_mensal: values.valor_mensal,
        recorrencia: values.recorrencia,
        categoria_id: values.categoria_id || null,
        observacao: values.observacao || null,
      }
      if (isEditing) {
        await updateCategory.mutateAsync({ id: category.id, values: payload })
        toast.success('Receita atualizada')
      } else {
        await createCategory.mutateAsync(payload)
        toast.success('Receita criada')
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao salvar receita'))
    }
  }

  const isSubmitting = createCategory.isPending || updateCategory.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar receita' : 'Nova receita'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField label="Nome" htmlFor="nome" error={errors.nome?.message}>
            <Input id="nome" {...register('nome')} />
          </FormField>

          <FormField label="Valor mensal (R$)" htmlFor="valor_mensal" error={errors.valor_mensal?.message}>
            <Input id="valor_mensal" type="number" step="0.01" {...register('valor_mensal')} />
          </FormField>

          <FormField label="Recorrência" htmlFor="recorrencia">
            <Controller
              control={control}
              name="recorrencia"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="recorrencia" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(recurrenceLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField label="Categoria (opcional)" htmlFor="categoria_id">
            <Controller
              control={control}
              name="categoria_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="categoria_id" className="w-full">
                    <SelectValue placeholder="Nenhuma" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span
                          className="mr-1 inline-block size-2.5 rounded-full"
                          style={{ backgroundColor: c.cor }}
                        />
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-xs text-muted-foreground">
              Usada como sugestão automática ao confirmar o recebimento ou lançar avulso.
            </p>
          </FormField>

          <FormField label="Observação" htmlFor="observacao">
            <Input id="observacao" {...register('observacao')} />
          </FormField>

          <DialogFooter>
            <SubmitButton pending={isSubmitting}>Salvar</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
