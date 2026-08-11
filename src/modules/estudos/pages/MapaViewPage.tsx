import { useNavigate, useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { LoadingState } from '@/shared/components/common/LoadingState'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { useMapaMental, useCriarMapaMental, useDeleteMapaMental } from '@/modules/estudos/hooks/useMapasMentais'
import { MindMapCanvas } from '@/modules/estudos/components/mapas/MindMapCanvas'
import type { MindMapNode } from '@/modules/estudos/lib/mindMapLayout'
import { getErrorMessage } from '@/shared/lib/errors'

export default function MapaViewPage() {
  const { mapaId } = useParams<{ mapaId: string }>()
  const navigate = useNavigate()
  const { data: mapa, isLoading } = useMapaMental(mapaId)
  const criarMapa = useCriarMapaMental()
  const deleteMapa = useDeleteMapaMental()

  function handleRegenerar() {
    if (!mapa) return
    criarMapa.mutate(
      { notaIds: mapa.nota_ids, mapaId: mapa.id },
      {
        onSuccess: () => toast.success('Mapa atualizado'),
        onError: (err) => toast.error(getErrorMessage(err, 'Não consegui gerar o mapa de novo')),
      },
    )
  }

  function handleExcluir() {
    if (!mapa) return
    deleteMapa.mutate(mapa.id, {
      onSuccess: () => navigate('/estudos/mapas'),
      onError: () => toast.error('Não consegui excluir esse mapa'),
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link to="/estudos/mapas" aria-label="Voltar">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="font-display flex-1 truncate text-lg font-semibold">{mapa?.titulo ?? 'Mapa mental'}</h1>
        <Button variant="outline" size="sm" onClick={handleRegenerar} disabled={!mapa || criarMapa.isPending}>
          <RefreshCw className={criarMapa.isPending ? 'size-4 animate-spin' : 'size-4'} />
          Gerar novamente
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-destructive"
          aria-label="Excluir mapa"
          onClick={handleExcluir}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {isLoading && <LoadingState />}
      {!isLoading && !mapa && <EmptyState message="Mapa não encontrado." />}
      {mapa && <MindMapCanvas root={mapa.conteudo as unknown as MindMapNode} />}
    </div>
  )
}
