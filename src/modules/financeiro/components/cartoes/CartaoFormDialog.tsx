import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { FormField } from '@/shared/components/common/FormField'
import { SubmitButton } from '@/shared/components/common/SubmitButton'
import { CATEGORIA_COLORS } from '@/modules/financeiro/lib/categoriaColors'
import { useCreateCartao, useUpdateCartao } from '@/modules/financeiro/hooks/useCartoes'
import { getErrorMessage } from '@/shared/lib/errors'
import { cn } from '@/shared/lib/utils'
import type { Enums, Tables } from '@/shared/types/database.types'

type CartaoTipo = Enums<'cartao_tipo'>

const schema = z.object({
  nome: z.string().min(1, 'Informe um nome'),
  cor: z.string().min(1, 'Escolha uma cor'),
  valor: z.coerce.number().min(0, 'Informe um valor válido'),
})

type FormInput = z.input<typeof schema>
type FormOutput = z.output<typeof schema>

interface CartaoFormDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  cartao?: Tables<'cartoes'>
  tipo: CartaoTipo
}

function defaultValuesFor(cartao: Tables<'cartoes'> | undefined, tipo: CartaoTipo): FormInput {
  if (!cartao) return { nome: '', cor: CATEGORIA_COLORS[0], valor: 0 }
  return {
    nome: cartao.nome,
    cor: cartao.cor,
    valor: tipo === 'credito' ? (cartao.limite ?? 0) : cartao.saldo_reconciliado,
  }
}

export function CartaoFormDialog({ open, onOpenChange, cartao, tipo }: CartaoFormDialogProps) {
  const createCartao = useCreateCartao()
  const updateCartao = useUpdateCartao()
  const isEditing = !!cartao

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: defaultValuesFor(cartao, tipo),
  })

  useEffect(() => {
    if (open) reset(defaultValuesFor(cartao, tipo))
  }, [open, cartao, tipo, reset])

  async function onSubmit(values: FormOutput) {
    try {
      if (isEditing) {
        await updateCartao.mutateAsync({
          id: cartao.id,
          values:
            tipo === 'credito'
              ? { nome: values.nome, cor: values.cor, limite: values.valor }
              : {
                  nome: values.nome,
                  cor: values.cor,
                  saldo_reconciliado: values.valor,
                  saldo_reconciliado_em: new Date().toISOString(),
                },
        })
        toast.success('Cartão atualizado')
      } else {
        await createCartao.mutateAsync({
          nome: values.nome,
          cor: values.cor,
          tipo,
          limite: tipo === 'credito' ? values.valor : null,
          saldo_reconciliado: tipo === 'debito' ? values.valor : 0,
        })
        toast.success('Cartão criado')
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao salvar cartão'))
    }
  }

  const isSubmitting = createCartao.isPending || updateCartao.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar cartão' : tipo === 'credito' ? 'Novo cartão de crédito' : 'Novo cartão de débito'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField label="Nome" htmlFor="nome" error={errors.nome?.message}>
            <Input id="nome" placeholder="Ex: Nubank, Inter, Itaú..." {...register('nome')} />
          </FormField>

          <FormField
            label={tipo === 'credito' ? 'Limite (R$)' : 'Saldo atual (R$)'}
            htmlFor="valor"
            error={errors.valor?.message}
          >
            <Input id="valor" type="number" inputMode="decimal" step="0.01" {...register('valor')} />
            {tipo === 'debito' && isEditing && (
              <p className="text-xs text-muted-foreground">
                Ajustar aqui reconcilia o saldo a partir de agora, igual à configuração global.
              </p>
            )}
          </FormField>

          <FormField label="Cor" htmlFor="cor" error={errors.cor?.message}>
            <Controller
              control={control}
              name="cor"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {CATEGORIA_COLORS.map((cor) => (
                    <button
                      key={cor}
                      type="button"
                      aria-label={cor}
                      onClick={() => field.onChange(cor)}
                      className={cn(
                        'press-feedback flex size-8 items-center justify-center rounded-full ring-offset-2 ring-offset-card transition-shadow',
                        field.value === cor && 'ring-2 ring-foreground',
                      )}
                      style={{ backgroundColor: cor }}
                    >
                      {field.value === cor && <Check className="size-4 text-white" />}
                    </button>
                  ))}
                </div>
              )}
            />
          </FormField>

          <DialogFooter>
            <SubmitButton pending={isSubmitting}>Salvar</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
