import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { LoadingState } from '@/shared/components/common/LoadingState'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { useMaterias, useCreateMateria, useUpdateMateria, useDeleteMateria } from '@/modules/estudos/hooks/useMaterias'
import { nextStudyColor, studyColorVar } from '@/modules/estudos/lib/studyColors'

export function MateriaManageDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: materias = [], isLoading } = useMaterias()
  const createMateria = useCreateMateria()
  const updateMateria = useUpdateMateria()
  const deleteMateria = useDeleteMateria()
  const [nome, setNome] = useState('')

  function handleAdd() {
    const n = nome.trim()
    if (!n) return
    createMateria.mutate(
      { nome: n },
      {
        onError: () => toast.error('Não consegui criar essa matéria'),
        onSuccess: () => setNome(''),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Matérias</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {isLoading && <LoadingState rows={2} />}

          {!isLoading && materias.length === 0 && (
            <EmptyState message="Nenhuma matéria ainda. Crie a primeira aqui embaixo." />
          )}

          {materias.length > 0 && (
            <div className="flex flex-col divide-y">
              {materias.map((m) => (
                <div key={m.id} className="flex items-center gap-2 py-2">
                  <button
                    type="button"
                    title="Trocar cor"
                    className="press-feedback size-6 shrink-0 rounded-md"
                    style={{ backgroundColor: studyColorVar(m.cor) }}
                    onClick={() =>
                      updateMateria.mutate({ id: m.id, values: { cor: nextStudyColor(m.cor) } })
                    }
                  />
                  <p className="flex-1 text-sm font-medium">{m.nome}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      deleteMateria.mutate(m.id, {
                        onError: () => toast.error('Não consegui excluir essa matéria'),
                      })
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Nova matéria"
            />
            <Button onClick={handleAdd} disabled={createMateria.isPending}>
              Adicionar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
