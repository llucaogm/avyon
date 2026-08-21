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
import { Textarea } from '@/shared/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { useCreatePost, useUpdatePost } from '@/modules/producao/hooks/usePosts'
import {
  PLATAFORMA_LABELS,
  PLATAFORMA_ORDER,
  TIPO_LABELS,
  TIPO_ORDER,
  STATUS_LABELS,
  STATUS_ORDER,
  APROVACAO_LABELS,
  APROVACAO_ORDER,
} from '@/modules/producao/lib/plataformaCores'
import { FormField } from '@/shared/components/common/FormField'
import { SubmitButton } from '@/shared/components/common/SubmitButton'
import { getErrorMessage } from '@/shared/lib/errors'
import type { Tables } from '@/shared/types/database.types'

const schema = z.object({
  titulo: z.string().min(1, 'Informe um título'),
  plataforma: z.enum(['instagram', 'tiktok', 'youtube', 'linkedin', 'outro']),
  tipo: z.enum(['estatico', 'carrossel', 'reels', 'video', 'stories']),
  status: z.enum(['ideia', 'roteiro', 'gravacao', 'edicao', 'agendado', 'publicado']),
  aprovacao: z.enum(['esperando', 'aprovado', 'reprovado']),
  data_publicacao: z.string().optional(),
  legenda: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface PostFormDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  post?: Tables<'posts'>
  /** Pré-preenche a data ao abrir pra criar (ex: clique num dia do calendário). */
  defaultData?: string
}

function defaultValuesFor(post: Tables<'posts'> | undefined, defaultData?: string): FormValues {
  if (!post) {
    return {
      titulo: '',
      plataforma: 'instagram',
      tipo: 'reels',
      status: 'ideia',
      aprovacao: 'esperando',
      data_publicacao: defaultData ?? '',
      legenda: '',
    }
  }
  return {
    titulo: post.titulo,
    plataforma: post.plataforma,
    tipo: post.tipo,
    status: post.status,
    aprovacao: post.aprovacao,
    data_publicacao: post.data_publicacao ?? '',
    legenda: post.legenda ?? '',
  }
}

export function PostFormDialog({ open, onOpenChange, post, defaultData }: PostFormDialogProps) {
  const createPost = useCreatePost()
  const updatePost = useUpdatePost()
  const isEditing = !!post

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValuesFor(post, defaultData),
  })

  useEffect(() => {
    if (open) reset(defaultValuesFor(post, defaultData))
  }, [open, post, defaultData, reset])

  async function onSubmit(values: FormValues) {
    try {
      const payload = {
        titulo: values.titulo,
        plataforma: values.plataforma,
        tipo: values.tipo,
        status: values.status,
        aprovacao: values.aprovacao,
        data_publicacao: values.data_publicacao || null,
        legenda: values.legenda || null,
      }
      if (isEditing) {
        await updatePost.mutateAsync({ id: post.id, values: payload })
        toast.success('Post atualizado')
      } else {
        await createPost.mutateAsync(payload)
        toast.success('Post criado')
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao salvar post'))
    }
  }

  const isSubmitting = createPost.isPending || updatePost.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar post' : 'Novo post'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField label="Título" htmlFor="titulo" error={errors.titulo?.message}>
            <Input id="titulo" placeholder="Ex: Dica de terça, Bastidores..." {...register('titulo')} autoFocus />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Plataforma" htmlFor="plataforma">
              <Controller
                control={control}
                name="plataforma"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="plataforma" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATAFORMA_ORDER.map((p) => (
                        <SelectItem key={p} value={p}>
                          {PLATAFORMA_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField label="Tipo" htmlFor="tipo">
              <Controller
                control={control}
                name="tipo"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="tipo" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPO_ORDER.map((t) => (
                        <SelectItem key={t} value={t}>
                          {TIPO_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Status" htmlFor="status">
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_ORDER.map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField label="Data (opcional)" htmlFor="data_publicacao">
              <Controller
                control={control}
                name="data_publicacao"
                render={({ field }) => (
                  <DatePicker id="data_publicacao" value={field.value} onChange={field.onChange} clearable />
                )}
              />
            </FormField>
          </div>

          <FormField label="Aprovação" htmlFor="aprovacao">
            <Controller
              control={control}
              name="aprovacao"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="aprovacao" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APROVACAO_ORDER.map((a) => (
                      <SelectItem key={a} value={a}>
                        {APROVACAO_LABELS[a]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField label="Legenda (opcional)" htmlFor="legenda">
            <Textarea id="legenda" rows={3} placeholder="Legenda ou observações do post..." {...register('legenda')} />
          </FormField>

          <DialogFooter>
            <SubmitButton pending={isSubmitting}>Salvar</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
