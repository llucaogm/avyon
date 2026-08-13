import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { SubmitButton } from '@/shared/components/common/SubmitButton'
import { LoadingState } from '@/shared/components/common/LoadingState'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { useRoteiro, useUpdateRoteiro, useDeleteRoteiro } from '@/modules/producao/hooks/useRoteiros'
import { usePosts } from '@/modules/producao/hooks/usePosts'
import { RoteiroBlocoRow } from '@/modules/producao/components/producao/RoteiroBlocoRow'
import { novoBloco, type RoteiroBloco } from '@/modules/producao/lib/roteiroBlocos'
import { getErrorMessage } from '@/shared/lib/errors'

export default function RoteiroEditorPage() {
  const { roteiroId } = useParams<{ roteiroId: string }>()
  const navigate = useNavigate()
  const { data: roteiro, isLoading } = useRoteiro(roteiroId)
  const { data: posts = [] } = usePosts()
  const updateRoteiro = useUpdateRoteiro()
  const deleteRoteiro = useDeleteRoteiro()

  const [titulo, setTitulo] = useState('')
  const [postId, setPostId] = useState<string | undefined>(undefined)
  const [blocos, setBlocos] = useState<RoteiroBloco[]>([])

  useEffect(() => {
    if (roteiro) {
      setTitulo(roteiro.titulo)
      setPostId(roteiro.post_id ?? undefined)
      setBlocos((roteiro.blocos as unknown as RoteiroBloco[]) ?? [])
    }
  }, [roteiro])

  function updateBloco(id: string, next: RoteiroBloco) {
    setBlocos((prev) => prev.map((b) => (b.id === id ? next : b)))
  }

  function removeBloco(id: string) {
    setBlocos((prev) => prev.filter((b) => b.id !== id))
  }

  function moveBloco(id: string, direction: -1 | 1) {
    setBlocos((prev) => {
      const index = prev.findIndex((b) => b.id === id)
      const target = index + direction
      if (index < 0 || target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function addBloco() {
    setBlocos((prev) => [...prev, novoBloco('')])
  }

  async function handleSalvar() {
    if (!roteiroId) return
    try {
      await updateRoteiro.mutateAsync({ id: roteiroId, titulo: titulo.trim() || 'Sem título', post_id: postId ?? null, blocos })
      toast.success('Roteiro salvo')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao salvar roteiro'))
    }
  }

  function handleExcluir() {
    if (!roteiroId) return
    deleteRoteiro.mutate(roteiroId, {
      onSuccess: () => navigate('/producao/roteiros'),
      onError: () => toast.error('Não consegui excluir esse roteiro'),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link to="/producao/roteiros" aria-label="Voltar">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <Input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título do roteiro"
          className="font-display flex-1 border-none bg-transparent text-lg font-semibold shadow-none focus-visible:ring-1"
        />
        <SubmitButton pending={updateRoteiro.isPending} onClick={handleSalvar}>
          Salvar
        </SubmitButton>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-destructive"
          aria-label="Excluir roteiro"
          onClick={handleExcluir}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {isLoading && <LoadingState />}
      {!isLoading && !roteiro && <EmptyState message="Roteiro não encontrado." />}

      {roteiro && (
        <>
          <div className="max-w-xs">
            <Select value={postId} onValueChange={setPostId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Vincular a um post (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {posts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="hidden gap-2 px-3 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[140px_90px_1fr_1fr_auto]">
            <span>Bloco</span>
            <span>Tempo</span>
            <span>Fala / Texto</span>
            <span>Visual / Ação</span>
            <span />
          </div>

          <div className="flex flex-col gap-2">
            {blocos.map((bloco, index) => (
              <RoteiroBlocoRow
                key={bloco.id}
                bloco={bloco}
                onChange={(next) => updateBloco(bloco.id, next)}
                onRemove={() => removeBloco(bloco.id)}
                onMoveUp={() => moveBloco(bloco.id, -1)}
                onMoveDown={() => moveBloco(bloco.id, 1)}
                canMoveUp={index > 0}
                canMoveDown={index < blocos.length - 1}
              />
            ))}
          </div>

          <Button variant="outline" size="sm" className="self-start" onClick={addBloco}>
            <Plus className="size-4" />
            Adicionar bloco
          </Button>
        </>
      )}
    </div>
  )
}
