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
import { useCreateCategoria, useUpdateCategoria, type CategoriaTipo } from '@/modules/financeiro/hooks/useCategorias'
import { getErrorMessage } from '@/shared/lib/errors'
import { cn } from '@/shared/lib/utils'
import type { Tables } from '@/shared/types/database.types'

const schema = z.object({
  nome: z.string().min(1, 'Informe um nome'),
  cor: z.string().min(1, 'Escolha uma cor'),
})

type FormValues = z.infer<typeof schema>

interface CategoriaFormDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  categoria?: Tables<'categorias'>
  tipo: CategoriaTipo
}

export function CategoriaFormDialog({ open, onOpenChange, categoria, tipo }: CategoriaFormDialogProps) {
  const createCategoria = useCreateCategoria()
  const updateCategoria = useUpdateCategoria()
  const isEditing = !!categoria

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', cor: CATEGORIA_COLORS[0] },
  })

  useEffect(() => {
    if (open) {
      reset(categoria ? { nome: categoria.nome, cor: categoria.cor } : { nome: '', cor: CATEGORIA_COLORS[0] })
    }
  }, [open, categoria, reset])

  async function onSubmit(values: FormValues) {
    try {
      if (isEditing) {
        await updateCategoria.mutateAsync({ id: categoria.id, values })
        toast.success('Categoria atualizada')
      } else {
        await createCategoria.mutateAsync({ ...values, tipo })
        toast.success('Categoria criada')
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao salvar categoria'))
    }
  }

  const isSubmitting = createCategoria.isPending || updateCategoria.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField label="Nome" htmlFor="nome" error={errors.nome?.message}>
            <Input id="nome" placeholder="Ex: Transporte, Lazer, Alimentação..." {...register('nome')} />
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
