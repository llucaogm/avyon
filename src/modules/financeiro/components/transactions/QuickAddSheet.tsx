import { useEffect, useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { Input } from '@/shared/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/shared/components/ui/toggle-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { useExpenseCategories, useIncomeCategories } from '@/modules/financeiro/hooks/useCategories'
import { useCategorias } from '@/modules/financeiro/hooks/useCategorias'
import { useCartoes } from '@/modules/financeiro/hooks/useCartoes'
import {
  useCreateTransaction,
  useUpdateTransaction,
  useRecentTransactions,
} from '@/modules/financeiro/hooks/useTransactions'
import { suggestCategory } from '@/modules/financeiro/lib/categorySuggest'
import { todayIso } from '@/modules/financeiro/lib/monthUtils'
import { getErrorMessage } from '@/shared/lib/errors'
import { FormField } from '@/shared/components/common/FormField'
import { SubmitButton } from '@/shared/components/common/SubmitButton'
import { cn } from '@/shared/lib/utils'
import type { Tables } from '@/shared/types/database.types'

// Lido dentro do superRefine via ref (não pelo valor do form) — se existir ao
// menos 1 cartão de débito cadastrado, toda receita nova passa a exigir cartão,
// pra ficar rastreável. Sem cartões de débito ainda, o campo continua opcional.
const requireCartaoEmEntradaRef = { current: false }

const schema = z
  .object({
    tipo: z.enum(['entrada', 'saida']),
    valor: z.coerce.number().positive('Informe um valor maior que zero'),
    descricao: z.string().min(1, 'Descreva o lançamento'),
    categoryId: z.string().optional(),
    categoriaId: z.string().optional(),
    cartaoId: z.string().optional(),
    data: z.string().min(1),
  })
  .superRefine((values, ctx) => {
    if (!values.categoriaId) {
      ctx.addIssue({ path: ['categoriaId'], code: z.ZodIssueCode.custom, message: 'Selecione uma categoria' })
    }
    if (requireCartaoEmEntradaRef.current && values.tipo === 'entrada' && !values.cartaoId) {
      ctx.addIssue({
        path: ['cartaoId'],
        code: z.ZodIssueCode.custom,
        message: 'Selecione onde esse dinheiro está entrando',
      })
    }
  })

type FormInput = z.input<typeof schema>
type FormOutput = z.output<typeof schema>

interface QuickAddSheetProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  transaction?: Tables<'transactions'>
}

function defaultValuesFor(transaction: Tables<'transactions'> | undefined): FormInput {
  if (!transaction) {
    return {
      tipo: 'saida',
      valor: undefined,
      descricao: '',
      categoryId: undefined,
      categoriaId: undefined,
      cartaoId: undefined,
      data: todayIso(),
    }
  }
  const isEntrada = transaction.valor_entrada > 0
  return {
    tipo: isEntrada ? 'entrada' : 'saida',
    valor: isEntrada ? transaction.valor_entrada : transaction.valor_saida,
    descricao: transaction.descricao,
    categoryId: transaction.expense_category_id ?? transaction.income_category_id ?? undefined,
    categoriaId: transaction.categoria_id ?? undefined,
    cartaoId: transaction.cartao_id ?? undefined,
    data: transaction.data,
  }
}

export function QuickAddSheet({ open, onOpenChange, transaction }: QuickAddSheetProps) {
  const isEditing = !!transaction
  // Sheet de baixo no celular (alcance de polegar), dialog compacto e
  // centralizado no PC — o formulário inteiro esticado full-width numa tela
  // grande não é ergonômico nem parece um popup de verdade.
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const { data: expenseCategories = [] } = useExpenseCategories()
  const { data: incomeCategories = [] } = useIncomeCategories()
  const { data: categoriasDespesa = [] } = useCategorias('despesa')
  const { data: categoriasReceita = [] } = useCategorias('receita')
  const { data: cartoesDebito = [] } = useCartoes('debito')
  const { data: cartoesCredito = [] } = useCartoes('credito')
  const { data: recentTransactions = [] } = useRecentTransactions()
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const [autoSuggestedFixo, setAutoSuggestedFixo] = useState(false)
  const [autoSuggestedCategoria, setAutoSuggestedCategoria] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: defaultValuesFor(transaction),
  })

  const tipo = watch('tipo')
  const descricao = watch('descricao')
  const categoryId = watch('categoryId')

  const fixoOptions = tipo === 'saida' ? expenseCategories : incomeCategories
  const categoriaOptions = tipo === 'saida' ? categoriasDespesa : categoriasReceita
  const fixoField = tipo === 'saida' ? 'expense_category_id' : 'income_category_id'
  // Crédito só entra como opção em saídas — ele nunca recebe lançamento manual
  // de entrada, só via "Pagar fatura" em Cartões.
  const cartaoOptions = tipo === 'saida' ? [...cartoesDebito, ...cartoesCredito] : cartoesDebito
  requireCartaoEmEntradaRef.current = cartoesDebito.length > 0

  const fixoSuggestion = useMemo(() => {
    return suggestCategory(descricao, recentTransactions, fixoField)
  }, [descricao, recentTransactions, fixoField])

  const categoriaSuggestion = useMemo(() => {
    return suggestCategory(descricao, recentTransactions, 'categoria_id')
  }, [descricao, recentTransactions])

  useEffect(() => {
    if (fixoSuggestion && !autoSuggestedFixo) {
      setValue('categoryId', fixoSuggestion)
      setAutoSuggestedFixo(true)
    }
  }, [fixoSuggestion, autoSuggestedFixo, setValue])

  useEffect(() => {
    if (categoriaSuggestion && !autoSuggestedCategoria) {
      setValue('categoriaId', categoriaSuggestion)
      setAutoSuggestedCategoria(true)
    }
  }, [categoriaSuggestion, autoSuggestedCategoria, setValue])

  // A Gasto Fixo/Receita Fixa can carry its own default Categoria e Cartão —
  // applying eles quando um é escolhido evita re-selecionar todo mês. Só pra
  // lançamentos novos: editando, o que já está salvo na transação venceu e não
  // pode ser trocado por baixo dos panos só porque o Gasto Fixo mudou depois.
  useEffect(() => {
    if (isEditing || !categoryId) return
    const fixo = fixoOptions.find((c) => c.id === categoryId)
    if (fixo?.categoria_id) {
      setValue('categoriaId', fixo.categoria_id)
    }
    if (fixo?.cartao_id) {
      setValue('cartaoId', fixo.cartao_id)
    }
  }, [categoryId, fixoOptions, isEditing, setValue])

  // Reset (not clear) on open — loads the transaction being edited, or blank
  // defaults for a new one. Auto-suggest is pre-armed as "already suggested"
  // when editing, so it never overwrites the categorization already saved.
  useEffect(() => {
    if (open) {
      reset(defaultValuesFor(transaction))
      setAutoSuggestedFixo(isEditing)
      setAutoSuggestedCategoria(isEditing)
    }
  }, [open, transaction, isEditing, reset])

  async function onSubmit(values: FormOutput) {
    try {
      const payload = {
        data: values.data,
        descricao: values.descricao,
        valor_entrada: values.tipo === 'entrada' ? values.valor : 0,
        valor_saida: values.tipo === 'saida' ? values.valor : 0,
        expense_category_id: values.tipo === 'saida' ? values.categoryId || null : null,
        income_category_id: values.tipo === 'entrada' ? values.categoryId || null : null,
        categoria_id: values.categoriaId || null,
        cartao_id: values.cartaoId || null,
      }
      if (isEditing) {
        await updateTransaction.mutateAsync({ id: transaction.id, values: payload })
        toast.success('Lançamento atualizado')
      } else {
        await createTransaction.mutateAsync(payload)
        toast.success('Lançamento adicionado')
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao salvar'))
    }
  }

  const title = isEditing ? 'Editar lançamento' : 'Novo lançamento'

  const form = (
    <form onSubmit={handleSubmit(onSubmit)} className={cn('flex flex-col gap-4', !isDesktop && 'px-4 pb-6')}>
          <Controller
            control={control}
            name="tipo"
            render={({ field }) => (
              <ToggleGroup
                type="single"
                value={field.value}
                onValueChange={(v) => {
                  if (v) {
                    field.onChange(v)
                    setValue('categoryId', undefined)
                    setValue('categoriaId', undefined)
                    setValue('cartaoId', undefined)
                    setAutoSuggestedFixo(false)
                    setAutoSuggestedCategoria(false)
                  }
                }}
                className="w-full"
              >
                <ToggleGroupItem value="saida" className="flex-1">
                  Saída
                </ToggleGroupItem>
                <ToggleGroupItem value="entrada" className="flex-1">
                  Entrada
                </ToggleGroupItem>
              </ToggleGroup>
            )}
          />

          <FormField label="Valor (R$)" htmlFor="valor" error={errors.valor?.message}>
            <Input
              id="valor"
              type="number"
              inputMode="decimal"
              step="0.01"
              autoFocus
              {...register('valor')}
            />
          </FormField>

          <FormField label="Descrição" htmlFor="descricao" error={errors.descricao?.message}>
            <Input id="descricao" placeholder="Ex: Mercado, Uber, Salário..." {...register('descricao')} />
          </FormField>

          <FormField label="Categoria" htmlFor="categoriaId" error={errors.categoriaId?.message}>
            <Controller
              control={control}
              name="categoriaId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="categoriaId" className="w-full">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriaOptions.map((c) => (
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
            {categoriaSuggestion && !isEditing && (
              <p className="text-xs text-muted-foreground">Categoria sugerida com base no histórico</p>
            )}
          </FormField>

          <FormField label="Cartão" htmlFor="cartaoId" error={errors.cartaoId?.message}>
            <Controller
              control={control}
              name="cartaoId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="cartaoId" className="w-full">
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
          </FormField>

          <FormField
            label={tipo === 'saida' ? 'Gasto Fixo (opcional)' : 'Receita Fixa (opcional)'}
            htmlFor="categoryId"
          >
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="categoryId" className="w-full">
                    <SelectValue placeholder={tipo === 'saida' ? 'Nenhum' : 'Nenhuma'} />
                  </SelectTrigger>
                  <SelectContent>
                    {fixoOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField label="Data" htmlFor="data">
            <Input id="data" type="date" {...register('data')} />
          </FormField>

          <SubmitButton pending={createTransaction.isPending || updateTransaction.isPending} className="mt-2">
            Salvar
          </SubmitButton>
    </form>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {form}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        {form}
      </SheetContent>
    </Sheet>
  )
}
