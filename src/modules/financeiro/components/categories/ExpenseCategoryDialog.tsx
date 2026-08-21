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
import { DatePicker } from '@/shared/components/common/DatePicker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { useCreateExpenseCategory, useUpdateExpenseCategory } from '@/modules/financeiro/hooks/useCategories'
import { useCategorias } from '@/modules/financeiro/hooks/useCategorias'
import { useCartoes } from '@/modules/financeiro/hooks/useCartoes'
import { CATEGORY_GROUP_LABELS } from '@/modules/financeiro/lib/categoryGroups'
import { getErrorMessage } from '@/shared/lib/errors'
import { FormField } from '@/shared/components/common/FormField'
import { SubmitButton } from '@/shared/components/common/SubmitButton'
import type { Tables } from '@/shared/types/database.types'

const schema = z.object({
  nome: z.string().min(1, 'Informe um nome'),
  valor_mensal: z.coerce.number().min(0, 'Não pode ser negativo'),
  grupo: z.enum(['fixo', 'variavel', 'objetivo', 'reserva']),
  frequencia: z.enum(['mensal', 'anual', 'semestral', 'unico']),
  categoria_id: z.string().optional(),
  cartao_id: z.string().optional(),
  due_month: z.string().optional(),
  charge_date: z.string().optional(),
  dia_vencimento: z.string().optional(),
  end_date: z.string().optional(),
  observacao: z.string().optional(),
})

type FormInput = z.input<typeof schema>
type FormOutput = z.output<typeof schema>

// Same 4 groups as CATEGORY_GROUP_LABELS — reused here so the Select stays in
// sync with the zod enum's own literal union (both ultimately mirror the
// database's category_group type).
const groupLabels: Record<FormOutput['grupo'], string> = CATEGORY_GROUP_LABELS

const frequencyLabels: Record<FormOutput['frequencia'], string> = {
  mensal: 'Mensal',
  anual: 'Anual',
  semestral: 'Semestral',
  unico: 'Único',
}

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

interface ExpenseCategoryDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  category?: Tables<'expense_categories'>
  defaultGroup?: FormOutput['grupo']
}

export function ExpenseCategoryDialog({
  open,
  onOpenChange,
  category,
  defaultGroup,
}: ExpenseCategoryDialogProps) {
  const createCategory = useCreateExpenseCategory()
  const updateCategory = useUpdateExpenseCategory()
  const { data: categorias = [] } = useCategorias('despesa')
  const { data: cartoesDebito = [] } = useCartoes('debito')
  const { data: cartoesCredito = [] } = useCartoes('credito')
  const cartaoOptions = [...cartoesDebito, ...cartoesCredito]
  const isEditing = !!category

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<
    FormInput,
    unknown,
    FormOutput
  >({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '',
      valor_mensal: 0,
      grupo: defaultGroup ?? 'fixo',
      frequencia: 'mensal',
      categoria_id: undefined,
      cartao_id: undefined,
      due_month: undefined,
      charge_date: undefined,
      dia_vencimento: undefined,
      end_date: undefined,
      observacao: '',
    },
  })

  const frequencia = watch('frequencia')

  useEffect(() => {
    if (open) {
      reset(
        category
          ? {
              nome: category.nome,
              valor_mensal: category.valor_mensal,
              grupo: category.grupo,
              frequencia: category.frequencia,
              categoria_id: category.categoria_id ?? undefined,
              cartao_id: category.cartao_id ?? undefined,
              due_month: category.due_month ? String(category.due_month) : undefined,
              charge_date: category.charge_date ?? undefined,
              dia_vencimento: category.dia_vencimento ? String(category.dia_vencimento) : undefined,
              end_date: category.end_date ?? undefined,
              observacao: category.observacao ?? '',
            }
          : {
              nome: '',
              valor_mensal: 0,
              grupo: defaultGroup ?? 'fixo',
              frequencia: 'mensal',
              categoria_id: undefined,
              cartao_id: undefined,
              due_month: undefined,
              charge_date: undefined,
              dia_vencimento: undefined,
              end_date: undefined,
              observacao: '',
            },
      )
    }
  }, [open, category, defaultGroup, reset])

  async function onSubmit(values: FormOutput) {
    try {
      const payload = {
        nome: values.nome,
        valor_mensal: values.valor_mensal,
        grupo: values.grupo,
        frequencia: values.frequencia,
        categoria_id: values.categoria_id || null,
        cartao_id: values.cartao_id || null,
        due_month: values.due_month ? Number(values.due_month) : null,
        charge_date: values.charge_date || null,
        dia_vencimento: values.dia_vencimento ? Number(values.dia_vencimento) : null,
        end_date: values.end_date || null,
        observacao: values.observacao || null,
      }
      if (isEditing) {
        await updateCategory.mutateAsync({ id: category.id, values: payload })
        toast.success('Gasto fixo atualizado')
      } else {
        await createCategory.mutateAsync(payload)
        toast.success('Gasto fixo criado')
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao salvar gasto fixo'))
    }
  }

  const isSubmitting = createCategory.isPending || updateCategory.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar gasto fixo' : 'Novo gasto fixo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField label="Nome" htmlFor="nome" error={errors.nome?.message}>
            <Input id="nome" {...register('nome')} />
          </FormField>

          <FormField label="Valor mensal (R$)" htmlFor="valor_mensal" error={errors.valor_mensal?.message}>
            <Input id="valor_mensal" type="number" step="0.01" {...register('valor_mensal')} />
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
              Usada como sugestão automática ao confirmar o pagamento ou lançar avulso.
            </p>
          </FormField>

          <FormField label="Cartão (opcional)" htmlFor="cartao_id">
            <Controller
              control={control}
              name="cartao_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="cartao_id" className="w-full">
                    <SelectValue placeholder="Nenhum" />
                  </SelectTrigger>
                  <SelectContent>
                    {cartaoOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span
                          className="mr-1 inline-block size-2.5 rounded-full"
                          style={{ backgroundColor: c.cor }}
                        />
                        {c.nome}
                        <span className="text-muted-foreground"> · {c.tipo === 'credito' ? 'Crédito' : 'Débito'}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-xs text-muted-foreground">
              Preenche o cartão automaticamente ao lançar esse gasto fixo avulso.
            </p>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Grupo" htmlFor="grupo">
              <Controller
                control={control}
                name="grupo"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="grupo" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(groupLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField label="Frequência" htmlFor="frequencia">
              <Controller
                control={control}
                name="frequencia"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="frequencia" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(frequencyLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>

          {(frequencia === 'anual' || frequencia === 'semestral') && (
            <FormField label="Mês de cobrança" htmlFor="due_month">
              <Controller
                control={control}
                name="due_month"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="due_month" className="w-full">
                      <SelectValue placeholder="Selecione o mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((m, i) => (
                        <SelectItem key={m} value={String(i + 1)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          )}

          {frequencia === 'unico' && (
            <FormField label="Data da cobrança" htmlFor="charge_date">
              <Controller
                control={control}
                name="charge_date"
                render={({ field }) => <DatePicker id="charge_date" value={field.value} onChange={field.onChange} clearable />}
              />
            </FormField>
          )}

          {frequencia === 'mensal' && (
            <FormField label="Dia de vencimento (opcional)" htmlFor="dia_vencimento">
              <Input id="dia_vencimento" type="number" min="1" max="31" {...register('dia_vencimento')} />
            </FormField>
          )}

          <FormField label="Termina em (opcional)" htmlFor="end_date">
            <Controller
              control={control}
              name="end_date"
              render={({ field }) => <DatePicker id="end_date" value={field.value} onChange={field.onChange} clearable />}
            />
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
