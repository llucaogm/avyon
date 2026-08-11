import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Trash2, Network } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { LoadingState } from '@/shared/components/common/LoadingState'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { useMapasMentais, useDeleteMapaMental } from '@/modules/estudos/hooks/useMapasMentais'

export default function MapasListPage() {
  const { data: mapas = [], isLoading } = useMapasMentais()
  const deleteMapa = useDeleteMapaMental()

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Mapas</h1>
        <p className="text-sm text-muted-foreground">Mapas mentais gerados a partir das suas anotações.</p>
      </div>

      {isLoading && <LoadingState />}

      {!isLoading && mapas.length === 0 && (
        <EmptyState message="Nenhum mapa ainda. Em Anotações, toque em “Selecionar”, escolha algumas anotações e crie um mapa mental." />
      )}

      {mapas.length > 0 && (
        <div className="flex flex-col gap-2">
          {mapas.map((m) => (
            <Card key={m.id} className="animate-fade-in-up">
              <CardContent className="flex items-center gap-3 py-3">
                <Link to={`/estudos/mapas/${m.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="bg-gradient-brand text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-full">
                    <Network className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{m.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.nota_ids.length} anotaç{m.nota_ids.length === 1 ? 'ão' : 'ões'} ·{' '}
                      {new Date(m.updated_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive shrink-0"
                  aria-label="Excluir mapa"
                  onClick={() =>
                    deleteMapa.mutate(m.id, { onError: () => toast.error('Não consegui excluir esse mapa') })
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
