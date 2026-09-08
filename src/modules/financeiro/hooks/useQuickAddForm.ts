import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
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

interface UseQuickAddFormArgs {
  open: boolean
  onOpenChange: (v: boolean) => void
  transaction?: Tables<'transactions'>
}

/** Todo o estado e regra de negócio do formulário de lançamento rápido —
 * schema, sugestão automática de categoria/cartão a partir do histórico,
 * sincronização com Gasto Fixo/Receita Fixa e o submit. QuickAddSheet fica
 * só com a apresentação (campos + wrapper responsivo). */
export function useQuickAddForm({ open, onOpenChange, transaction }: UseQuickAddFormArgs) {
  const isEditing = !!transaction
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

  // Chamado pelo ToggleGroup de tipo — troca entrada/saída zera o que só faz
  // sentido pro tipo anterior e rearma a auto-sugestão pro novo.
  function handleTipoChange(value: string) {
    setValue('tipo', value as FormInput['tipo'])
    setValue('categoryId', undefined)
    setValue('categoriaId', undefined)
    setValue('cartaoId', undefined)
    setAutoSuggestedFixo(false)
    setAutoSuggestedCategoria(false)
  }

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

  return {
    register,
    handleSubmit,
    control,
    errors,
    tipo,
    fixoOptions,
    categoriaOptions,
    cartaoOptions,
    categoriaSuggestion,
    isEditing,
    isPending: createTransaction.isPending || updateTransaction.isPending,
    handleTipoChange,
    onSubmit,
  }
}
