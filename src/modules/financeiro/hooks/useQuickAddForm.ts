import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
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
 * schema, sugestão automática de categoria a partir do histórico e o submit.
 * QuickAddSheet fica só com a apresentação (campos + wrapper responsivo). */
export function useQuickAddForm({ open, onOpenChange, transaction }: UseQuickAddFormArgs) {
  const isEditing = !!transaction
  const { data: categoriasDespesa = [] } = useCategorias('despesa')
  const { data: categoriasReceita = [] } = useCategorias('receita')
  const { data: cartoesDebito = [] } = useCartoes('debito')
  const { data: cartoesCredito = [] } = useCartoes('credito')
  const { data: recentTransactions = [] } = useRecentTransactions()
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
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

  const categoriaOptions = tipo === 'saida' ? categoriasDespesa : categoriasReceita
  // Crédito só entra como opção em saídas — ele nunca recebe lançamento manual
  // de entrada, só via "Pagar fatura" em Cartões.
  const cartaoOptions = tipo === 'saida' ? [...cartoesDebito, ...cartoesCredito] : cartoesDebito
  requireCartaoEmEntradaRef.current = cartoesDebito.length > 0

  const categoriaSuggestion = useMemo(() => {
    return suggestCategory(descricao, recentTransactions, 'categoria_id')
  }, [descricao, recentTransactions])

  useEffect(() => {
    if (categoriaSuggestion && !autoSuggestedCategoria) {
      setValue('categoriaId', categoriaSuggestion)
      setAutoSuggestedCategoria(true)
    }
  }, [categoriaSuggestion, autoSuggestedCategoria, setValue])

  // Reset (not clear) on open — loads the transaction being edited, or blank
  // defaults for a new one. Auto-suggest is pre-armed as "already suggested"
  // when editing, so it never overwrites the categorization already saved.
  useEffect(() => {
    if (open) {
      reset(defaultValuesFor(transaction))
      setAutoSuggestedCategoria(isEditing)
    }
  }, [open, transaction, isEditing, reset])

  // Chamado pelo ToggleGroup de tipo — troca entrada/saída zera o que só faz
  // sentido pro tipo anterior e rearma a auto-sugestão pro novo.
  function handleTipoChange(value: string) {
    setValue('tipo', value as FormInput['tipo'])
    setValue('categoriaId', undefined)
    setValue('cartaoId', undefined)
    setAutoSuggestedCategoria(false)
  }

  async function onSubmit(values: FormOutput) {
    try {
      const payload = {
        data: values.data,
        descricao: values.descricao,
        valor_entrada: values.tipo === 'entrada' ? values.valor : 0,
        valor_saida: values.tipo === 'saida' ? values.valor : 0,
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
    categoriaOptions,
    cartaoOptions,
    categoriaSuggestion,
    isEditing,
    isPending: createTransaction.isPending || updateTransaction.isPending,
    handleTipoChange,
    onSubmit,
  }
}
