import { useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { LoadingState } from '@/shared/components/common/LoadingState'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { useReferencias, useDeleteReferencia } from '@/modules/producao/hooks/useReferencias'
import { ReferenciaRow } from '@/modules/producao/components/producao/ReferenciaRow'
import { ReferenciaViewSheet } from '@/modules/producao/components/producao/ReferenciaViewSheet'
import { ReferenciaFormDialog } from '@/modules/producao/components/producao/ReferenciaFormDialog'
import type { Tables } from '@/shared/types/database.types'

export default function ReferenciasPage() {
  const { data: referencias = [], isLoading } = useReferencias()
  const deleteReferencia = useDeleteReferencia()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Tables<'referencias'> | undefined>()
  const [viewing, setViewing] = useState<Tables<'referencias'> | null>(null)

  function handleDelete(id: string) {
    deleteReferencia.mutate(id, {
      onSuccess: () => setViewing(null),
      onError: () => toast.error('Não consegui excluir essa referência'),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Referências</h1>
          <p className="text-sm text-muted-foreground">Cole um link — a lista monta sozinha o preview.</p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="size-4" />
          Nova referência
        </Button>
      </div>

      {isLoading && <LoadingState />}
      {!isLoading && referencias.length === 0 && (
        <EmptyState message="Nenhuma referência ainda. Cole o link de um vídeo pra começar." />
      )}

      <div className="flex flex-col gap-2">
        {referencias.map((r, index) => (
          <ReferenciaRow key={r.id} referencia={r} index={index} onClick={() => setViewing(r)} />
        ))}
      </div>

      <ReferenciaFormDialog open={dialogOpen} onOpenChange={setDialogOpen} referencia={editing} />

      <ReferenciaViewSheet
        referencia={viewing}
        onOpenChange={(v) => !v && setViewing(null)}
        onEdit={(r) => {
          setViewing(null)
          setEditing(r)
          setDialogOpen(true)
        }}
        onDelete={handleDelete}
      />
    </div>
  )
}
