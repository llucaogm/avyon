import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, Trash2, StickyNote } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { LoadingState } from '@/shared/components/common/LoadingState'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { useConversas, useDeleteConversa } from '@/modules/estudos/hooks/useChat'
import { useNotas } from '@/modules/estudos/hooks/useNotas'

export default function ChatListPage() {
  const { data: conversas = [], isLoading } = useConversas()
  const { data: notas = [] } = useNotas()
  const deleteConversa = useDeleteConversa()

  const notaTituloById = useMemo(() => {
    const map = new Map<string, string>()
    for (const n of notas) map.set(n.id, n.titulo)
    return map
  }, [notas])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-semibold">Chat</h1>
          <p className="text-sm text-muted-foreground">Converse sobre o que você está estudando.</p>
        </div>
        <Button asChild size="sm">
          <Link to="/estudos/chat/nova">
            <Plus className="size-4" />
            Nova conversa
          </Link>
        </Button>
      </div>

      {isLoading && <LoadingState />}

      {!isLoading && conversas.length === 0 && (
        <EmptyState message="Nenhuma conversa ainda. Cole um texto ou pergunte algo pra começar." />
      )}

      {conversas.length > 0 && (
        <div className="flex flex-col gap-2">
          {conversas.map((c) => (
            <Card key={c.id} className="animate-fade-in-up">
              <CardContent className="flex items-center gap-3 py-3">
                <Link to={`/estudos/chat/${c.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.titulo}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(c.updated_at).toLocaleDateString('pt-BR')}</span>
                    {c.nota_id && notaTituloById.get(c.nota_id) && (
                      <Badge variant="secondary" className="gap-1">
                        <StickyNote className="size-3" />
                        {notaTituloById.get(c.nota_id)}
                      </Badge>
                    )}
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive shrink-0"
                  aria-label="Excluir conversa"
                  onClick={() =>
                    deleteConversa.mutate(c.id, {
                      onError: () => toast.error('Não consegui excluir essa conversa'),
                    })
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
