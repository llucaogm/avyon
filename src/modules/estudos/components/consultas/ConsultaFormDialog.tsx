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
import { Textarea } from '@/shared/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { FormField } from '@/shared/components/common/FormField'
import { SubmitButton } from '@/shared/components/common/SubmitButton'
import { useMaterias } from '@/modules/estudos/hooks/useMaterias'
import { useCreateConsulta, useUpdateConsulta } from '@/modules/estudos/hooks/useConsultas'
import { getErrorMessage } from '@/shared/lib/errors'
import type { Tables } from '@/shared/types/database.types'

const schema = z.object({
  titulo: z.string().min(1, 'Informe um título'),
  descricao: z.string().optional(),
  materia_id: z.string().optional(),
  html: z.string().min(1, 'Cole o HTML do manual'),
})

type FormValues = z.infer<typeof schema>

interface ConsultaFormDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  /** Pra editar, passe a linha completa (com `html`) — a lista não carrega esse campo. */
  consulta?: Tables<'consultas'>
}

function defaultValuesFor(consulta: Tables<'consultas'> | undefined): FormValues {
  if (!consulta) return { titulo: '', descricao: '', materia_id: undefined, html: '' }
  return {
    titulo: consulta.titulo,
    descricao: consulta.descricao ?? '',
    materia_id: consulta.materia_id ?? undefined,
    html: consulta.html,
  }
}

export function ConsultaFormDialog({ open, onOpenChange, consulta }: ConsultaFormDialogProps) {
  const { data: materias = [] } = useMaterias()
  const createConsulta = useCreateConsulta()
  const updateConsulta = useUpdateConsulta()
  const isEditing = !!consulta

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValuesFor(consulta),
  })

  useEffect(() => {
    if (open) reset(defaultValuesFor(consulta))
  }, [open, consulta, reset])

  async function onSubmit(values: FormValues) {
    try {
      const payload = {
        titulo: values.titulo,
        descricao: values.descricao || null,
        materia_id: values.materia_id || null,
        html: values.html,
      }
      if (isEditing) {
        await updateConsulta.mutateAsync({ id: consulta.id, values: payload })
        toast.success('Consulta atualizada')
      } else {
        await createConsulta.mutateAsync(payload)
        toast.success('Consulta criada')
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao salvar consulta'))
    }
  }

  const isSubmitting = createConsulta.isPending || updateConsulta.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar consulta' : 'Nova consulta'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField label="Título" htmlFor="titulo" error={errors.titulo?.message}>
            <Input id="titulo" placeholder="Ex: Manual de Ângulos de Câmera" {...register('titulo')} autoFocus />
          </FormField>

          <FormField label="Descrição (opcional)" htmlFor="descricao">
            <Input id="descricao" placeholder="Uma linha pra lembrar do que se trata" {...register('descricao')} />
          </FormField>

          <FormField label="Matéria (opcional)" htmlFor="materia_id">
            <Controller
              control={control}
              name="materia_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="materia_id" className="w-full">
                    <SelectValue placeholder="Nenhuma" />
                  </SelectTrigger>
                  <SelectContent>
                    {materias.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField label="HTML do manual" htmlFor="html" error={errors.html?.message}>
            <Textarea
              id="html"
              rows={10}
              placeholder="Cole aqui o HTML completo do manual..."
              className="font-mono text-xs"
              {...register('html')}
            />
            <p className="text-xs text-muted-foreground">
              Cole o arquivo inteiro (com &lt;html&gt;, &lt;style&gt; etc.) — cada consulta guarda seu próprio visual.
            </p>
          </FormField>

          <DialogFooter>
            <SubmitButton pending={isSubmitting}>Salvar</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
