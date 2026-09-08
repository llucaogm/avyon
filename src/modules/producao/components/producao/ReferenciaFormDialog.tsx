import { useEffect, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { FormField } from '@/shared/components/common/FormField'
import { SubmitButton } from '@/shared/components/common/SubmitButton'
import {
  useCreateReferencia,
  useUpdateReferencia,
  useFetchOembed,
} from '@/modules/producao/hooks/useReferencias'
import { usePosts } from '@/modules/producao/hooks/usePosts'
import { PLATAFORMA_LABELS, PLATAFORMA_ORDER } from '@/modules/producao/lib/plataformaCores'
import { TIPO_REFERENCIA_OPTIONS } from '@/modules/producao/lib/tipoReferencia'
import { CATEGORIA_COLORS } from '@/modules/financeiro/lib/categoriaColors'
import { getErrorMessage } from '@/shared/lib/errors'
import { cn } from '@/shared/lib/utils'
import type { Tables } from '@/shared/types/database.types'

const schema = z.object({
  titulo: z.string().min(1, 'Informe um título'),
  url: z.string().optional(),
  plataforma: z.enum(['instagram', 'tiktok', 'youtube', 'linkedin', 'outro']).optional(),
  thumbnail_url: z.string().optional(),
  tipo: z.string().optional(),
  resumo: z.string().optional(),
  cor: z.string().min(1),
  post_id: z.string().optional(),
  observacao: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function defaultValuesFor(referencia: Tables<'referencias'> | undefined): FormValues {
  if (!referencia) {
    return {
      titulo: '',
      url: '',
      plataforma: undefined,
      thumbnail_url: '',
      tipo: '',
      resumo: '',
      cor: CATEGORIA_COLORS[0],
      post_id: undefined,
      observacao: '',
    }
  }
  return {
    titulo: referencia.titulo,
    url: referencia.url ?? '',
    plataforma: referencia.plataforma ?? undefined,
    thumbnail_url: referencia.thumbnail_url ?? '',
    tipo: referencia.tipo ?? '',
    resumo: referencia.resumo ?? '',
    cor: referencia.cor,
    post_id: referencia.post_id ?? undefined,
    observacao: referencia.observacao ?? '',
  }
}

export function ReferenciaFormDialog({
  open,
  onOpenChange,
  referencia,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  referencia?: Tables<'referencias'>
}) {
  const { data: posts = [] } = usePosts()
  const createReferencia = useCreateReferencia()
  const updateReferencia = useUpdateReferencia()
  const fetchOembed = useFetchOembed()
  const isEditing = !!referencia

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValuesFor(referencia),
  })

  const lastFetchedUrl = useRef<string>('')

  useEffect(() => {
    if (open) {
      reset(defaultValuesFor(referencia))
      lastFetchedUrl.current = referencia?.url ?? ''
    }
  }, [open, referencia, reset])

  async function handleUrlBlur() {
    const url = getValues('url')?.trim()
    if (!url || url === lastFetchedUrl.current) return
    lastFetchedUrl.current = url
    try {
      const result = await fetchOembed.mutateAsync(url)
      setValue('plataforma', result.plataforma)
      if (!getValues('titulo').trim() && result.titulo) setValue('titulo', result.titulo)
      if (result.thumbnail_url) setValue('thumbnail_url', result.thumbnail_url)
      if (!getValues('tipo')?.trim() && result.tipo) setValue('tipo', result.tipo)
      if (!getValues('resumo')?.trim() && result.resumo) setValue('resumo', result.resumo)
      if (result.thumbnail_url || result.titulo || result.resumo) toast.success('Preview encontrado')
      else toast.info('Sem preview automático pra esse link — preencha manualmente se quiser')
    } catch {
      // Busca de preview é um extra, não impede salvar a referência sem ele.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar referência' : 'Nova referência'}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(async (values) => {
            try {
              const payload = {
                titulo: values.titulo,
                url: values.url || null,
                plataforma: values.plataforma ?? null,
                thumbnail_url: values.thumbnail_url || null,
                tipo: values.tipo || null,
                resumo: values.resumo || null,
                cor: values.cor,
                post_id: values.post_id || null,
                observacao: values.observacao || null,
              }
              if (isEditing) {
                await updateReferencia.mutateAsync({ id: referencia.id, values: payload })
                toast.success('Referência atualizada')
              } else {
                await createReferencia.mutateAsync(payload)
                toast.success('Referência criada')
              }
              onOpenChange(false)
            } catch (err) {
              toast.error(getErrorMessage(err, 'Erro ao salvar referência'))
            }
          })}
          className="flex flex-col gap-4"
        >
          <FormField label="Link" htmlFor="url" error={errors.url?.message}>
            <Input
              id="url"
              type="url"
              placeholder="https://..."
              {...register('url', { onBlur: handleUrlBlur })}
            />
            {fetchOembed.isPending && <p className="text-xs text-muted-foreground">Buscando preview...</p>}
          </FormField>

          <FormField label="Título" htmlFor="titulo" error={errors.titulo?.message}>
            <Input id="titulo" placeholder="Ex: Vídeo de referência" {...register('titulo')} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Plataforma" htmlFor="plataforma">
              <Controller
                control={control}
                name="plataforma"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="plataforma" className="w-full">
                      <SelectValue placeholder="Selecione" />
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

            <FormField label="Tipo (opcional)" htmlFor="tipo">
              <Controller
                control={control}
                name="tipo"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="tipo" className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPO_REFERENCIA_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>

          <FormField label="Thumbnail (opcional)" htmlFor="thumbnail_url">
            <Input id="thumbnail_url" type="url" placeholder="https://... (URL de uma imagem)" {...register('thumbnail_url')} />
            <p className="text-xs text-muted-foreground">
              Preenchido automático quando dá pra achar (inclusive Instagram, via preview público do post).
            </p>
          </FormField>

          <FormField label="Resumo (opcional, gerado por IA)" htmlFor="resumo">
            <Textarea
              id="resumo"
              rows={3}
              placeholder="Preenchido automático quando o link tiver legenda/descrição pra ler"
              {...register('resumo')}
            />
          </FormField>

          <FormField label="Vincular a um post (opcional)" htmlFor="post_id">
            <Controller
              control={control}
              name="post_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="post_id" className="w-full">
                    <SelectValue placeholder="Nenhum" />
                  </SelectTrigger>
                  <SelectContent>
                    {posts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField label="Cor de fallback" htmlFor="cor">
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
            <p className="text-xs text-muted-foreground">Usada no quadrado do feed quando não há thumbnail.</p>
          </FormField>

          <FormField label="Notas (opcional)" htmlFor="observacao">
            <Textarea id="observacao" rows={2} {...register('observacao')} />
          </FormField>

          <DialogFooter>
            <SubmitButton pending={createReferencia.isPending || updateReferencia.isPending}>Salvar</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
