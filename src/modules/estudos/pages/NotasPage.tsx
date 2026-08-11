import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ListChecks, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { LoadingState } from '@/shared/components/common/LoadingState'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { useMaterias } from '@/modules/estudos/hooks/useMaterias'
import { useNotas, useDeleteNota } from '@/modules/estudos/hooks/useNotas'
import { useCriarMapaMental } from '@/modules/estudos/hooks/useMapasMentais'
import { NotaCard } from '@/modules/estudos/components/notas/NotaCard'
import { NotaFormDialog } from '@/modules/estudos/components/notas/NotaFormDialog'
import { NotaViewSheet } from '@/modules/estudos/components/notas/NotaViewSheet'
import { getErrorMessage } from '@/shared/lib/errors'
import { cn } from '@/shared/lib/utils'
import type { Tables } from '@/shared/types/database.types'

const MAX_NOTAS_MAPA = 15

const TIPOS = ['rascunho', 'livro', 'artigo', 'video', 'aula', 'podcast', 'ideia'] as const
const TIPO_LABELS: Record<(typeof TIPOS)[number], string> = {
  rascunho: 'Rascunho',
  livro: 'Livro',
  artigo: 'Artigo',
  video: 'Vídeo',
  aula: 'Aula',
  podcast: 'Podcast',
  ideia: 'Ideia',
}

export default function NotasPage() {
  const navigate = useNavigate()
  const { data: materias = [] } = useMaterias()
  const { data: notas = [], isLoading } = useNotas()
  const deleteNota = useDeleteNota()
  const criarMapa = useCriarMapaMental()

  const [busca, setBusca] = useState('')
  const [filtroMateria, setFiltroMateria] = useState<string | null>(null)
  const [filtroTipo, setFiltroTipo] = useState<(typeof TIPOS)[number] | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editando, setEditando] = useState<Tables<'notas'> | undefined>()
  const [visualizando, setVisualizando] = useState<Tables<'notas'> | null>(null)
  const [modoSelecao, setModoSelecao] = useState(false)
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set())

  function sairDoModoSelecao() {
    setModoSelecao(false)
    setSelecionadas(new Set())
  }

  function toggleSelecionada(id: string) {
    setSelecionadas((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < MAX_NOTAS_MAPA) {
        next.add(id)
      } else {
        toast.error(`Selecione no máximo ${MAX_NOTAS_MAPA} anotações por mapa`)
      }
      return next
    })
  }

  function handleCriarMapa() {
    if (selecionadas.size === 0) return
    criarMapa.mutate(
      { notaIds: Array.from(selecionadas) },
      {
        onSuccess: (mapa) => {
          sairDoModoSelecao()
          navigate(`/estudos/mapas/${mapa.id}`)
        },
        onError: (err) => toast.error(getErrorMessage(err, 'Não consegui gerar o mapa mental')),
      },
    )
  }

  const materiaNomeById = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of materias) map.set(m.id, m.nome)
    return map
  }, [materias])

  const listaFiltrada = useMemo(() => {
    const buscaLower = busca.trim().toLowerCase()
    return notas.filter((n) => {
      if (filtroMateria && n.materia_id !== filtroMateria) return false
      if (filtroTipo && n.tipo !== filtroTipo) return false
      if (buscaLower) {
        const alvo = [n.titulo, n.conteudo, n.resumo, n.fonte, ...(n.chaves ?? [])]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!alvo.includes(buscaLower)) return false
      }
      return true
    })
  }, [notas, busca, filtroMateria, filtroTipo])

  function nomeMateria(id: string | null) {
    return id ? materiaNomeById.get(id) ?? 'Sem matéria' : 'Sem matéria'
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-semibold">Anotações</h1>
          <p className="text-sm text-muted-foreground">O que você leu, viu ou ouviu — com suas palavras.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => (modoSelecao ? sairDoModoSelecao() : setModoSelecao(true))}
          >
            {modoSelecao ? (
              <>
                <X className="size-4" />
                Cancelar
              </>
            ) : (
              <>
                <ListChecks className="size-4" />
                Selecionar
              </>
            )}
          </Button>
          {!modoSelecao && (
            <Button
              size="sm"
              onClick={() => {
                setEditando(undefined)
                setFormOpen(true)
              }}
            >
              <Plus className="size-4" />
              Nova anotação
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por título, conteúdo, fonte…"
        />
        <div className="flex flex-wrap gap-1.5">
          <Button
            variant={filtroMateria === null ? 'default' : 'outline'}
            size="sm"
            className="h-7 rounded-full px-3 text-xs"
            onClick={() => setFiltroMateria(null)}
          >
            Todas as matérias
          </Button>
          {materias.map((m) => (
            <Button
              key={m.id}
              variant={filtroMateria === m.id ? 'default' : 'outline'}
              size="sm"
              className="h-7 rounded-full px-3 text-xs"
              onClick={() => setFiltroMateria(m.id)}
            >
              {m.nome}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button
            variant={filtroTipo === null ? 'default' : 'outline'}
            size="sm"
            className="h-7 rounded-full px-3 text-xs"
            onClick={() => setFiltroTipo(null)}
          >
            Qualquer origem
          </Button>
          {TIPOS.map((t) => (
            <Button
              key={t}
              variant={filtroTipo === t ? 'default' : 'outline'}
              size="sm"
              className="h-7 rounded-full px-3 text-xs"
              onClick={() => setFiltroTipo(t)}
            >
              {TIPO_LABELS[t]}
            </Button>
          ))}
        </div>
      </div>

      {isLoading && <LoadingState />}

      {!isLoading && listaFiltrada.length === 0 && (
        <EmptyState
          message={
            notas.length
              ? 'Nada com esses filtros. Afrouxe a busca ou troque a matéria.'
              : 'Nenhuma anotação ainda. Comece pela primeira: título, fonte e o que você entendeu.'
          }
        />
      )}

      {listaFiltrada.length > 0 && (
        <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-3', modoSelecao && 'pb-20')}>
          {listaFiltrada.map((n) => (
            <NotaCard
              key={n.id}
              nota={n}
              materiaNome={nomeMateria(n.materia_id)}
              onLer={() => setVisualizando(n)}
              onEditar={() => {
                setEditando(n)
                setFormOpen(true)
              }}
              onExcluir={() =>
                deleteNota.mutate(n.id, {
                  onError: () => toast.error('Não consegui excluir essa anotação'),
                })
              }
              selecionavel={modoSelecao}
              selecionado={selecionadas.has(n.id)}
              onToggleSelecionado={() => toggleSelecionada(n.id)}
            />
          ))}
        </div>
      )}

      {modoSelecao && (
        <div className="fixed inset-x-0 bottom-16 z-40 flex justify-center px-4 md:bottom-4 md:left-56">
          <div className="flex items-center gap-3 rounded-full border bg-card px-4 py-2 shadow-lg">
            <span className="text-sm font-medium">
              {selecionadas.size} selecionada{selecionadas.size === 1 ? '' : 's'}
            </span>
            <Button size="sm" onClick={handleCriarMapa} disabled={selecionadas.size === 0 || criarMapa.isPending}>
              {criarMapa.isPending ? 'Gerando…' : 'Criar mapa mental'}
            </Button>
          </div>
        </div>
      )}

      <NotaFormDialog open={formOpen} onOpenChange={setFormOpen} nota={editando} />
      <NotaViewSheet
        nota={visualizando}
        materiaNome={nomeMateria(visualizando?.materia_id ?? null)}
        onOpenChange={(v) => !v && setVisualizando(null)}
      />
    </div>
  )
}
