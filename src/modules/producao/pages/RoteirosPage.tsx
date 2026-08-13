import { useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ScrollText, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
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
import { useRoteiros, useCreateRoteiro, useDeleteRoteiro } from '@/modules/producao/hooks/useRoteiros'
import { usePosts } from '@/modules/producao/hooks/usePosts'
import { formatDate } from '@/shared/lib/formatters'
import { getErrorMessage } from '@/shared/lib/errors'

export default function RoteirosPage() {
  const { data: roteiros = [], isLoading } = useRoteiros()
  const { data: posts = [] } = usePosts()
  const deleteRoteiro = useDeleteRoteiro()
  const [dialogOpen, setDialogOpen] = useState(false)

  const postById = new Map(posts.map((p) => [p.id, p]))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Roteiros</h1>
          <p className="text-sm text-muted-foreground">Estruture seus vídeos em blocos, com tempo, fala e visual.</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          Novo roteiro
        </Button>
      </div>

      {isLoading && <LoadingState />}
      {!isLoading && roteiros.length === 0 && (
        <EmptyState message="Nenhum roteiro ainda. Crie o primeiro." />
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {roteiros.map((roteiro, index) => {
          const post = roteiro.post_id ? postById.get(roteiro.post_id) : undefined
          return (
            <RoteiroCard
              key={roteiro.id}
              index={index}
              titulo={roteiro.titulo}
              postTitulo={post?.titulo}
              updatedAt={roteiro.updated_at}
              onDelete={() =>
                deleteRoteiro.mutate(roteiro.id, { onError: () => toast.error('Não consegui excluir esse roteiro') })
              }
              to={`/producao/roteiros/${roteiro.id}`}
            />
          )
        })}
      </div>

      <NovoRoteiroDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}

function RoteiroCard({
  index,
  titulo,
  postTitulo,
  updatedAt,
  onDelete,
  to,
}: {
  index: number
  titulo: string
  postTitulo?: string
  updatedAt: string
  onDelete: () => void
  to: string
}) {
  const navigate = useNavigate()
  return (
    <Card
      className="animate-fade-in-up lift-on-hover press-feedback cursor-pointer"
      style={{ '--stagger-index': index } as CSSProperties}
      onClick={() => navigate(to)}
    >
      <CardContent className="flex items-start justify-between gap-2 py-4">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ScrollText className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{titulo}</p>
            <p className="text-xs text-muted-foreground">
              {postTitulo ? `Vinculado a "${postTitulo}"` : formatDate(updatedAt.slice(0, 10))}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-destructive"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          aria-label="Excluir roteiro"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </CardContent>
    </Card>
  )
}

function NovoRoteiroDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate()
  const { data: posts = [] } = usePosts()
  const createRoteiro = useCreateRoteiro()
  const [titulo, setTitulo] = useState('')
  const [postId, setPostId] = useState<string | undefined>(undefined)

  async function handleCreate() {
    if (!titulo.trim()) return
    try {
      const roteiro = await createRoteiro.mutateAsync({ titulo: titulo.trim(), post_id: postId ?? null })
      onOpenChange(false)
      setTitulo('')
      setPostId(undefined)
      navigate(`/producao/roteiros/${roteiro.id}`)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao criar roteiro'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo roteiro</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <FormField label="Título" htmlFor="titulo-roteiro">
            <Input
              id="titulo-roteiro"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Reels de terça"
              autoFocus
            />
          </FormField>
          <FormField label="Vincular a um post (opcional)" htmlFor="post-roteiro">
            <Select value={postId} onValueChange={setPostId}>
              <SelectTrigger id="post-roteiro" className="w-full">
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
          </FormField>
        </div>
        <DialogFooter>
          <SubmitButton pending={createRoteiro.isPending} onClick={handleCreate}>
            Criar e abrir
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
