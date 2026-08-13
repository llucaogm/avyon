import { useMemo, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, BookOpenText, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { LoadingState } from '@/shared/components/common/LoadingState'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { useConsultas, useDeleteConsulta } from '@/modules/estudos/hooks/useConsultas'
import { useMaterias } from '@/modules/estudos/hooks/useMaterias'
import { ConsultaFormDialog } from '@/modules/estudos/components/consultas/ConsultaFormDialog'
import { studyColorVar } from '@/modules/estudos/lib/studyColors'
import { formatDate } from '@/shared/lib/formatters'

export default function ConsultasPage() {
  const { data: consultas = [], isLoading } = useConsultas()
  const { data: materias = [] } = useMaterias()
  const deleteConsulta = useDeleteConsulta()
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)

  const materiaById = useMemo(() => new Map(materias.map((m) => [m.id, m])), [materias])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Consultas</h1>
          <p className="text-sm text-muted-foreground">Manuais e colas pra consultar rapidinho, sempre à mão.</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          Nova consulta
        </Button>
      </div>

      {isLoading && <LoadingState />}
      {!isLoading && consultas.length === 0 && (
        <EmptyState message="Nenhuma consulta ainda. Cole o HTML de um manual pra começar." />
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {consultas.map((c, index) => {
          const materia = c.materia_id ? materiaById.get(c.materia_id) : undefined
          return (
            <Card
              key={c.id}
              className="animate-fade-in-up lift-on-hover press-feedback cursor-pointer"
              style={{ '--stagger-index': index } as CSSProperties}
              onClick={() => navigate(`/estudos/consultas/${c.id}`)}
            >
              <CardContent className="flex items-start justify-between gap-2 py-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <BookOpenText className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.titulo}</p>
                    {c.descricao && <p className="truncate text-xs text-muted-foreground">{c.descricao}</p>}
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      {materia && (
                        <span className="flex items-center gap-1">
                          <span
                            className="size-1.5 rounded-full"
                            style={{ backgroundColor: studyColorVar(materia.cor) }}
                          />
                          {materia.nome}
                        </span>
                      )}
                      <span>{formatDate(c.updated_at.slice(0, 10))}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteConsulta.mutate(c.id, { onError: () => toast.error('Não consegui excluir essa consulta') })
                  }}
                  aria-label="Excluir consulta"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <ConsultaFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
