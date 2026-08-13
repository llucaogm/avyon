import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Trash2, Pencil, Play, Check } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
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
import { LoadingState } from '@/shared/components/common/LoadingState'
import { EmptyState } from '@/shared/components/common/EmptyState'
import {
  useReferencias,
  useCreateReferencia,
  useUpdateReferencia,
  useDeleteReferencia,
  useFetchOembed,
} from '@/modules/producao/hooks/useReferencias'
import { usePosts } from '@/modules/producao/hooks/usePosts'
import { PLATAFORMA_CORES, PLATAFORMA_LABELS, PLATAFORMA_ORDER } from '@/modules/producao/lib/plataformaCores'
import { CATEGORIA_COLORS } from '@/modules/financeiro/lib/categoriaColors'
import { getErrorMessage } from '@/shared/lib/errors'
import { cn } from '@/shared/lib/utils'
import type { Tables } from '@/shared/types/database.types'

export default function ReferenciasPage() {
  const { data: referencias = [], isLoading } = useReferencias()
  const deleteReferencia = useDeleteReferencia()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Tables<'referencias'> | undefined>()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Referências</h1>
          <p className="text-sm text-muted-foreground">Cole um link — o feed monta sozinho o preview.</p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="size-4" />
          Nova referência
        </Button>
      </div>

      {isLoading && <LoadingState />}
      {!isLoading && referencias.length === 0 && (
        <EmptyState message="Nenhuma referência ainda. Cole o link de um vídeo pra começar." />
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {referencias.map((r, index) => (
          <ReferenciaTile
            key={r.id}
            referencia={r}
            index={index}
            onEdit={() => {
              setEditing(r)
              setDialogOpen(true)
            }}
            onDelete={() =>
              deleteReferencia.mutate(r.id, { onError: () => toast.error('Não consegui excluir essa referência') })
            }
          />
        ))}
      </div>

      <ReferenciaFormDialog open={dialogOpen} onOpenChange={setDialogOpen} referencia={editing} />
    </div>
  )
}

function ReferenciaTile({
  referencia: r,
  index,
  onEdit,
  onDelete,
}: {
  referencia: Tables<'referencias'>
  index: number
  onEdit: () => void
  onDelete: () => void
}) {
  const plataformaCor = r.plataforma ? PLATAFORMA_CORES[r.plataforma] : 'var(--muted-foreground)'
  const [imgError, setImgError] = useState(false)

  // Muitos CDNs de vídeo bloqueiam hotlink direto (referrer/CORS) mesmo pra uma
  // URL de oEmbed "pública" — sem isso, uma imagem que falha renderiza vazia,
  // deixando só o fundo escuro por trás em vez do card colorido de fallback.
  useEffect(() => {
    setImgError(false)
  }, [r.thumbnail_url])

  const showImage = !!r.thumbnail_url && !imgError

  return (
    <a
      href={r.url || undefined}
      target={r.url ? '_blank' : undefined}
      rel={r.url ? 'noreferrer' : undefined}
      onClick={(e) => {
        if (!r.url) e.preventDefault()
      }}
      className={cn(
        'animate-fade-in-up press-feedback relative aspect-square overflow-hidden rounded-xl border',
        r.url ? 'cursor-pointer' : 'cursor-default',
      )}
      style={{ '--stagger-index': Math.min(index, 8) } as CSSProperties}
    >
      {showImage ? (
        <img
          src={r.thumbnail_url!}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: r.cor }}>
          <Play className="size-8 text-white/70" />
        </div>
      )}

      <span
        className="absolute top-1.5 left-1.5 size-2.5 rounded-full ring-2 ring-black/30"
        style={{ backgroundColor: plataformaCor }}
      />

      <div className="absolute top-1.5 right-1.5 flex gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onEdit()
          }}
          className="press-feedback flex size-6 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
          aria-label="Editar referência"
        >
          <Pencil className="size-3" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDelete()
          }}
          className="press-feedback flex size-6 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
          aria-label="Excluir referência"
        >
          <Trash2 className="size-3" />
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-2 pt-6 pb-1.5">
        <p className="line-clamp-2 text-xs leading-tight font-medium text-white">{r.titulo}</p>
      </div>
    </a>
  )
}

const schema = z.object({
  titulo: z.string().min(1, 'Informe um título'),
  url: z.string().optional(),
  plataforma: z.enum(['instagram', 'tiktok', 'youtube', 'linkedin', 'outro']).optional(),
  thumbnail_url: z.string().optional(),
  tipo: z.string().optional(),
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
    cor: referencia.cor,
    post_id: referencia.post_id ?? undefined,
    observacao: referencia.observacao ?? '',
  }
}

function ReferenciaFormDialog({
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
      if (result.thumbnail_url || result.titulo) toast.success('Preview encontrado')
      else toast.info('Sem preview automático pra esse link — cole uma imagem manualmente se quiser')
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
              <Input id="tipo" placeholder="Inspiração, dado..." {...register('tipo')} />
            </FormField>
          </div>

          <FormField label="Thumbnail (opcional)" htmlFor="thumbnail_url">
            <Input id="thumbnail_url" type="url" placeholder="https://... (URL de uma imagem)" {...register('thumbnail_url')} />
            <p className="text-xs text-muted-foreground">
              Preenchido automático pra YouTube/TikTok. Instagram não tem preview automático — cole uma URL de imagem aqui se quiser.
            </p>
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

          <FormField label="Observação (opcional)" htmlFor="observacao">
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
