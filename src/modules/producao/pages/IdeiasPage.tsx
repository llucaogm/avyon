import { useState, type CSSProperties } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { LoadingState } from '@/shared/components/common/LoadingState'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { useIdeias, useCreateIdeia, useDeleteIdeia } from '@/modules/producao/hooks/useIdeias'
import { formatDateTime } from '@/shared/lib/formatters'
import { getErrorMessage } from '@/shared/lib/errors'

export default function IdeiasPage() {
  const { data: ideias = [], isLoading } = useIdeias()
  const createIdeia = useCreateIdeia()
  const deleteIdeia = useDeleteIdeia()
  const [texto, setTexto] = useState('')

  function handleCapturar() {
    const conteudo = texto.trim()
    if (!conteudo) return
    createIdeia.mutate(conteudo, {
      onSuccess: () => setTexto(''),
      onError: (err) => toast.error(getErrorMessage(err, 'Não consegui guardar essa ideia')),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Ideias</h1>
        <p className="text-sm text-muted-foreground">Captura rápida — desenvolva depois em Roteiros.</p>
      </div>

      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle className="font-display text-base">Nova ideia</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleCapturar()
            }}
            placeholder="Teve uma ideia? Anota aqui antes que esqueça..."
            rows={3}
          />
          <Button onClick={handleCapturar} disabled={createIdeia.isPending} className="self-start">
            Guardar ideia
          </Button>
        </CardContent>
      </Card>

      {isLoading && <LoadingState />}
      {!isLoading && ideias.length === 0 && <EmptyState message="Nenhuma ideia guardada ainda." />}

      <div className="flex flex-col gap-2">
        {ideias.map((ideia, index) => (
          <Card
            key={ideia.id}
            className="animate-fade-in-up"
            style={{ '--stagger-index': Math.min(index, 6) } as CSSProperties}
          >
            <CardContent className="flex items-start justify-between gap-2 py-3">
              <div>
                <p className="text-sm">{ideia.conteudo}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(ideia.created_at)}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0"
                onClick={() =>
                  deleteIdeia.mutate(ideia.id, { onError: () => toast.error('Não consegui excluir essa ideia') })
                }
              >
                <Trash2 className="size-3.5" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
