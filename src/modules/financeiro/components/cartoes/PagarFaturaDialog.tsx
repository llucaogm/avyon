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
import { useCartoes } from '@/modules/financeiro/hooks/useCartoes'
import { useBulkCreateTransactions } from '@/modules/financeiro/hooks/useTransactions'
import { todayIso } from '@/modules/financeiro/lib/monthUtils'
import { getErrorMessage } from '@/shared/lib/errors'
import type { Tables } from '@/shared/types/database.types'

const schema = z.object({
  cartaoDebitoId: z.string().min(1, 'Selecione de onde vai sair o dinheiro'),
  valor: z.coerce.number().positive('Informe um valor maior que zero'),
  data: z.string().min(1),
})

type FormInput = z.input<typeof schema>
type FormOutput = z.output<typeof schema>

interface PagarFaturaDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  cartaoCredito: Tables<'cartoes'>
}

export function PagarFaturaDialog({ open, onOpenChange, cartaoCredito }: PagarFaturaDialogProps) {
  const { data: debitos = [] } = useCartoes('debito')
  const bulkCreate = useBulkCreateTransactions()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { cartaoDebitoId: '', valor: undefined, data: todayIso() },
  })

  useEffect(() => {
    if (open) reset({ cartaoDebitoId: '', valor: undefined, data: todayIso() })
  }, [open, reset])

  async function onSubmit(values: FormOutput) {
    try {
      const hoje = todayIso()
      await bulkCreate.mutateAsync([
        {
          data: values.data,
          descricao: `Pagamento fatura — ${cartaoCredito.nome}`,
          valor_entrada: 0,
          valor_saida: values.valor,
          cartao_id: values.cartaoDebitoId,
        },
        {
          data: values.data || hoje,
          descricao: `Pagamento fatura — ${cartaoCredito.nome}`,
          valor_entrada: values.valor,
          valor_saida: 0,
          cartao_id: cartaoCredito.id,
        },
      ])
      toast.success('Fatura paga')
      onOpenChange(false)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao pagar fatura'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pagar fatura — {cartaoCredito.nome}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField label="Pagar com" htmlFor="cartaoDebitoId" error={errors.cartaoDebitoId?.message}>
            <Controller
              control={control}
              name="cartaoDebitoId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="cartaoDebitoId" className="w-full">
                    <SelectValue placeholder="Selecione um cartão de débito" />
                  </SelectTrigger>
                  <SelectContent>
                    {debitos.map((c) => (
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
          </FormField>

          <FormField label="Valor (R$)" htmlFor="valor" error={errors.valor?.message}>
            <Input id="valor" type="number" inputMode="decimal" step="0.01" autoFocus {...register('valor')} />
          </FormField>

          <FormField label="Data" htmlFor="data">
            <Input id="data" type="date" {...register('data')} />
          </FormField>

          <DialogFooter>
            <SubmitButton pending={bulkCreate.isPending}>Pagar fatura</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
