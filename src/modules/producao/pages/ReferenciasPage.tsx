import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Trash2, Pencil, Play, Check } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'
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
import { TIPO_REFERENCIA_OPTIONS } from '@/modules/producao/lib/tipoReferencia'
import { CATEGORIA_COLORS } from '@/modules/financeiro/lib/categoriaColors'
import { getErrorMessage } from '@/shared/lib/errors'
import { formatShortDate } from '@/shared/lib/formatters'
import { cn } from '@/shared/lib/utils'
import type { Tables } from '@/shared/types/database.types'

export default function ReferenciasPage() {
  const { data: referencias = [], isLoading } = useReferencias()
  const deleteReferencia = useDeleteReferencia()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Tables<'referencias'> | undefined>()
  const [viewing, setViewing] = useState<Tables<'referencias'> | null>(null)

  function handleDelete(id: string) {
    deleteReferencia.mutate(id, {
      onSuccess: () => setViewing(null),
      onError: () => toast.error('Não consegui excluir essa referência'),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Referências</h1>
          <p className="text-sm text-muted-foreground">Cole um link — a lista monta sozinha o preview.</p>
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

      <div className="flex flex-col gap-2">
        {referencias.map((r, index) => (
          <ReferenciaRow key={r.id} referencia={r} index={index} onClick={() => setViewing(r)} />
        ))}
      </div>

      <ReferenciaFormDialog open={dialogOpen} onOpenChange={setDialogOpen} referencia={editing} />

      <ReferenciaViewSheet
        referencia={viewing}
        onOpenChange={(v) => !v && setViewing(null)}
        onEdit={(r) => {
          setViewing(null)
          setEditing(r)
          setDialogOpen(true)
        }}
        onDelete={handleDelete}
      />
    </div>
  )
}

function ReferenciaRow({
  referencia: r,
  index,
  onClick,
}: {
  referencia: Tables<'referencias'>
  index: number
  onClick: () => void
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
    <button
      type="button"
      onClick={onClick}
      className="animate-fade-in-up press-feedback flex items-center gap-3 rounded-xl border p-2.5 text-left transition-colors hover:bg-muted/40"
      style={{ '--stagger-index': Math.min(index, 8) } as CSSProperties}
    >
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg">
        {showImage ? (
          <img
            src={r.thumbnail_url!}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: r.cor }}>
            <Play className="size-5 text-white/70" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: plataformaCor }} />
          {r.autor && <span className="truncate">{r.autor}</span>}
          <span className="shrink-0">{formatShortDate(r.created_at)}</span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm font-medium">{r.titulo}</p>
        {r.tipo && (
          <Badge variant="secondary" className="mt-1.5">
            {r.tipo}
          </Badge>
        )}
      </div>
    </button>
  )
}

function ReferenciaViewSheet({
  referencia,
  onOpenChange,
  onEdit,
  onDelete,
}: {
  referencia: Tables<'referencias'> | null
  onOpenChange: (v: boolean) => void
  onEdit: (r: Tables<'referencias'>) => void
  onDelete: (id: string) => void
}) {
  const updateReferencia = useUpdateReferencia()
  const [notas, setNotas] = useState('')

  useEffect(() => {
    setNotas(referencia?.observacao ?? '')
  }, [referencia])

  async function handleSalvarNotas() {
    if (!referencia) return
    try {
      await updateReferencia.mutateAsync({ id: referencia.id, values: { observacao: notas || null } })
      toast.success('Nota salva')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao salvar nota'))
    }
  }

  const abrirLabel = referencia?.plataforma ? `Abrir no ${PLATAFORMA_LABELS[referencia.plataforma]}` : 'Abrir link'
  const notasAlteradas = referencia && notas !== (referencia.observacao ?? '')

  return (
    <Sheet open={!!referencia} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        {referencia && (
          <>
            <SheetHeader>
              <SheetTitle>{referencia.titulo}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-5 px-4 pb-6">
              {referencia.thumbnail_url && (
                <img
                  src={referencia.thumbnail_url}
                  alt=""
                  className="aspect-video w-full rounded-lg object-cover"
                  referrerPolicy="no-referrer"
                />
              )}

              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                {referencia.plataforma && (
                  <Badge variant="secondary">{PLATAFORMA_LABELS[referencia.plataforma]}</Badge>
                )}
                {referencia.tipo && <Badge variant="secondary">{referencia.tipo}</Badge>}
                {referencia.autor && <span>{referencia.autor}</span>}
                <span>{formatShortDate(referencia.created_at)}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {referencia.url && (
                  <Button asChild size="sm">
                    <a href={referencia.url} target="_blank" rel="noreferrer">
                      {abrirLabel} ↗
                    </a>
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => onEdit(referencia)}>
                  <Pencil className="size-4" />
                  Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDelete(referencia.id)}>
                  <Trash2 className="size-4" />
                  Excluir
                </Button>
              </div>

              {referencia.resumo && (
                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Resumo</p>
                  <p className="text-sm leading-relaxed">{referencia.resumo}</p>
                </div>
              )}

              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Notas</p>
                <Textarea
                  rows={3}
                  placeholder="Suas anotações sobre essa referência"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                />
                {notasAlteradas && (
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={handleSalvarNotas}
                    disabled={updateReferencia.isPending}
                  >
                    Salvar nota
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

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
