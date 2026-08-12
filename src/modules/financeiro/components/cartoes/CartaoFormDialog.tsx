import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Check, Plus } from 'lucide-react'
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
import { BANCO_PRESETS } from '@/modules/financeiro/lib/bancoPresets'
import { useCreateCartao, useUpdateCartao, useSaldoGlobal } from '@/modules/financeiro/hooks/useCartoes'
import { CartaoVisual } from '@/modules/financeiro/components/cartoes/CartaoVisual'
import { getErrorMessage } from '@/shared/lib/errors'
import { formatCurrency } from '@/shared/lib/formatters'
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
  const { saldo: saldoLegado, usaCartoes } = useSaldoGlobal()
  const isEditing = !!cartao
  // Só faz sentido oferecer "usar saldo atual" antes do primeiro cartão de
  // débito existir — depois disso o saldo global já vem da soma dos cartões,
  // e reaplicar esse número num segundo cartão duplicaria o valor.
  const podeMigrarSaldo = !isEditing && tipo === 'debito' && !usaCartoes

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
    defaultValues: defaultValuesFor(cartao, tipo),
  })

  const nomePreview = watch('nome')
  const corPreview = watch('cor')

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
          <div className="mx-auto w-full max-w-56">
            <CartaoVisual
              cartao={{
                id: cartao?.id ?? 'preview',
                nome: nomePreview || 'Meu cartão',
                cor: corPreview || CATEGORIA_COLORS[0],
                tipo,
              }}
            />
          </div>

          {!isEditing && (
            <FormField label="Banco (opcional)" htmlFor="banco-presets">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {BANCO_PRESETS.map((banco) => (
                  <button
                    key={banco.id}
                    type="button"
                    onClick={() => {
                      setValue('nome', banco.nome)
                      setValue('cor', banco.cor)
                    }}
                    className={cn(
                      'press-feedback rounded-2xl outline-offset-4 transition-shadow',
                      nomePreview === banco.nome && corPreview === banco.cor && 'ring-2 ring-foreground',
                    )}
                  >
                    <CartaoVisual cartao={{ id: banco.id, nome: banco.nome, cor: banco.cor, tipo }} />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setValue('nome', '')
                    setValue('cor', CATEGORIA_COLORS[0])
                  }}
                  className="press-feedback flex aspect-[85.6/54] flex-col items-center justify-center gap-1 rounded-2xl border border-dashed text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                >
                  <Plus className="size-5" />
                  <span className="text-[10px]">Personalizado</span>
                </button>
              </div>
            </FormField>
          )}

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
            {podeMigrarSaldo && saldoLegado !== 0 && (
              <button
                type="button"
                onClick={() => setValue('valor', saldoLegado)}
                className="press-feedback self-start text-xs font-medium text-primary underline-offset-2 hover:underline"
              >
                Usar saldo atual ({formatCurrency(saldoLegado)})
              </button>
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
