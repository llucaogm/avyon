import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { LoadingState } from '@/shared/components/common/LoadingState'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { useMaterias } from '@/modules/estudos/hooks/useMaterias'
import { useNotas, useCreateNota } from '@/modules/estudos/hooks/useNotas'
import { MateriaManageDialog } from '@/modules/estudos/components/MateriaManageDialog'
import { NotaViewSheet } from '@/modules/estudos/components/notas/NotaViewSheet'
import { studyColorVar } from '@/modules/estudos/lib/studyColors'
import { getErrorMessage } from '@/shared/lib/errors'
import type { Tables } from '@/shared/types/database.types'

export default function HojePage() {
  const { data: materias = [], isLoading: loadingMaterias } = useMaterias()
  const { data: notas = [], isLoading: loadingNotas } = useNotas()
  const createNota = useCreateNota()

  const [manageOpen, setManageOpen] = useState(false)
  const [captura, setCaptura] = useState('')
  const [materiaId, setMateriaId] = useState<string | undefined>()
  const [visualizando, setVisualizando] = useState<Tables<'notas'> | null>(null)

  const materiaNomeById = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of materias) map.set(m.id, m.nome)
    return map
  }, [materias])

  const recentes = notas.slice(0, 4)
  const isLoading = loadingMaterias || loadingNotas

  function handleCapturar() {
    const texto = captura.trim()
    if (!texto) return
    createNota.mutate(
      {
        titulo: texto.slice(0, 80),
        tipo: 'rascunho',
        materia_id: materiaId ?? null,
        cor: 'amber',
      },
      {
        onSuccess: () => {
          setCaptura('')
          toast.success('Guardado em Anotações')
        },
        onError: (err) => toast.error(getErrorMessage(err, 'Não consegui guardar isso')),
      },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-semibold">Estudos</h1>
          <p className="text-sm text-muted-foreground">
            {notas.length} anotaç{notas.length === 1 ? 'ão guardada' : 'ões guardadas'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setManageOpen(true)}>
          Matérias
        </Button>
      </div>

      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle className="font-display text-base">Captura rápida</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {materias.length === 0 && !loadingMaterias ? (
            <EmptyState message="Crie uma matéria em “Matérias” pra começar a organizar suas anotações." />
          ) : (
            <>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={captura}
                  onChange={(e) => setCaptura(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCapturar()}
                  placeholder="Vi algo que quero guardar…"
                  className="flex-1"
                />
                <Select value={materiaId} onValueChange={setMateriaId}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Matéria" />
                  </SelectTrigger>
                  <SelectContent>
                    {materias.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleCapturar} disabled={createNota.isPending}>
                  Guardar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Cai em Anotações como rascunho. Você volta depois e trabalha em cima.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle className="font-display text-base">Últimas anotações</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y p-0">
          {isLoading && (
            <div className="p-4">
              <LoadingState rows={3} />
            </div>
          )}
          {!isLoading && recentes.length === 0 && (
            <div className="p-4">
              <EmptyState message="Arquivo vazio. Use a captura rápida aí em cima." />
            </div>
          )}
          {recentes.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setVisualizando(n)}
              className="flex items-center gap-3 p-3 text-left transition-colors hover:bg-muted/40"
            >
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: studyColorVar(n.cor) }} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{n.titulo}</p>
                <p className="text-xs text-muted-foreground">
                  {n.materia_id ? materiaNomeById.get(n.materia_id) ?? 'Sem matéria' : 'Sem matéria'} · {n.tipo}
                </p>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <MateriaManageDialog open={manageOpen} onOpenChange={setManageOpen} />
      <NotaViewSheet
        nota={visualizando}
        materiaNome={
          visualizando?.materia_id ? materiaNomeById.get(visualizando.materia_id) ?? 'Sem matéria' : 'Sem matéria'
        }
        onOpenChange={(v) => !v && setVisualizando(null)}
      />
    </div>
  )
}
