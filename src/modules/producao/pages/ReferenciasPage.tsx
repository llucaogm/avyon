import { useEffect, useState, type CSSProperties } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Trash2, Pencil, ExternalLink, Check } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'
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
} from '@/modules/producao/hooks/useReferencias'
import { usePosts } from '@/modules/producao/hooks/usePosts'
import { CATEGORIA_COLORS } from '@/modules/financeiro/lib/categoriaColors'
import { getErrorMessage } from '@/shared/lib/errors'
import { cn } from '@/shared/lib/utils'
import type { Tables } from '@/shared/types/database.types'

export default function ReferenciasPage() {
  const { data: referencias = [], isLoading } = useReferencias()
  const { data: posts = [] } = usePosts()
  const deleteReferencia = useDeleteReferencia()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Tables<'referencias'> | undefined>()

  const postById = new Map(posts.map((p) => [p.id, p]))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Referências</h1>
          <p className="text-sm text-muted-foreground">Links, inspirações e materiais de apoio.</p>
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
        <EmptyState message="Nenhuma referência ainda. Adicione a primeira." />
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {referencias.map((r, index) => {
          const post = r.post_id ? postById.get(r.post_id) : undefined
          return (
            <Card key={r.id} className="animate-fade-in-up" style={{ '--stagger-index': index } as CSSProperties}>
              <CardContent className="flex items-start justify-between gap-2 py-3">
                <div className="flex min-w-0 items-start gap-2">
                  <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: r.cor }} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.titulo}</p>
                    <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                      {r.tipo && <span className="rounded-full bg-muted px-1.5 py-0.5">{r.tipo}</span>}
                      {post && <span className="rounded-full bg-muted px-1.5 py-0.5">{post.titulo}</span>}
                    </div>
                    {r.url && (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 flex items-center gap-1 truncate text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="size-3 shrink-0" />
                        {r.url}
                      </a>
                    )}
                    {r.observacao && <p className="mt-1 text-xs text-muted-foreground">{r.observacao}</p>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setEditing(r)
                      setDialogOpen(true)
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      deleteReferencia.mutate(r.id, {
                        onError: () => toast.error('Não consegui excluir essa referência'),
                      })
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <ReferenciaFormDialog open={dialogOpen} onOpenChange={setDialogOpen} referencia={editing} />
    </div>
  )
}

const schema = z.object({
  titulo: z.string().min(1, 'Informe um título'),
  url: z.string().optional(),
  tipo: z.string().optional(),
  cor: z.string().min(1),
  post_id: z.string().optional(),
  observacao: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function defaultValuesFor(referencia: Tables<'referencias'> | undefined): FormValues {
  if (!referencia) {
    return { titulo: '', url: '', tipo: '', cor: CATEGORIA_COLORS[0], post_id: undefined, observacao: '' }
  }
  return {
    titulo: referencia.titulo,
    url: referencia.url ?? '',
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
  const isEditing = !!referencia

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValuesFor(referencia),
  })

  useEffect(() => {
    if (open) reset(defaultValuesFor(referencia))
  }, [open, referencia, reset])

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
          <FormField label="Título" htmlFor="titulo" error={errors.titulo?.message}>
            <Input id="titulo" placeholder="Ex: Vídeo de referência, artigo..." {...register('titulo')} autoFocus />
          </FormField>

          <FormField label="Link (opcional)" htmlFor="url">
            <Input id="url" type="url" placeholder="https://..." {...register('url')} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Tipo (opcional)" htmlFor="tipo">
              <Input id="tipo" placeholder="Inspiração, dado, concorrente..." {...register('tipo')} />
            </FormField>

            <FormField label="Vincular a um post" htmlFor="post_id">
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
          </div>

          <FormField label="Cor" htmlFor="cor">
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
