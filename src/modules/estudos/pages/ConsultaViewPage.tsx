import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { LoadingState } from '@/shared/components/common/LoadingState'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { useConsulta, useDeleteConsulta } from '@/modules/estudos/hooks/useConsultas'
import { ConsultaFormDialog } from '@/modules/estudos/components/consultas/ConsultaFormDialog'

export default function ConsultaViewPage() {
  const { consultaId } = useParams<{ consultaId: string }>()
  const navigate = useNavigate()
  const { data: consulta, isLoading } = useConsulta(consultaId)
  const deleteConsulta = useDeleteConsulta()
  const [editOpen, setEditOpen] = useState(false)

  function handleExcluir() {
    if (!consultaId) return
    deleteConsulta.mutate(consultaId, {
      onSuccess: () => navigate('/estudos/consultas'),
      onError: () => toast.error('Não consegui excluir essa consulta'),
    })
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link to="/estudos/consultas" aria-label="Voltar">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="font-display flex-1 truncate text-lg font-semibold">{consulta?.titulo ?? 'Consulta'}</h1>
        <Button variant="ghost" size="icon-sm" onClick={() => setEditOpen(true)} disabled={!consulta}>
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-destructive"
          aria-label="Excluir consulta"
          onClick={handleExcluir}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {isLoading && <LoadingState />}
      {!isLoading && !consulta && <EmptyState message="Consulta não encontrada." />}

      {consulta && (
        <iframe
          title={consulta.titulo}
          srcDoc={consulta.html}
          sandbox=""
          className="h-[75vh] w-full rounded-xl border"
        />
      )}

      <ConsultaFormDialog open={editOpen} onOpenChange={setEditOpen} consulta={consulta ?? undefined} />
    </div>
  )
}
