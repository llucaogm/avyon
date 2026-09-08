import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Textarea } from '@/shared/components/ui/textarea'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'
import { useUpdateReferencia } from '@/modules/producao/hooks/useReferencias'
import { PLATAFORMA_LABELS } from '@/modules/producao/lib/plataformaCores'
import { formatHandle } from '@/modules/producao/lib/referenciaFormat'
import { getErrorMessage } from '@/shared/lib/errors'
import { formatShortDate } from '@/shared/lib/formatters'
import type { Tables } from '@/shared/types/database.types'

export function ReferenciaViewSheet({
  referencia,
  onOpenChange,
  onEdit,
  onDelete,
}: {
  referencia: Tables<'referencias'> | null
  onOpenChange: (v: boolean) => void
  onEdit: (r: Tables<'referencias'>) => void
  onDelete: (id: string) => void
}) {
  const updateReferencia = useUpdateReferencia()
  const [notas, setNotas] = useState('')

  useEffect(() => {
    setNotas(referencia?.observacao ?? '')
  }, [referencia])

  async function handleSalvarNotas() {
    if (!referencia) return
    try {
      await updateReferencia.mutateAsync({ id: referencia.id, values: { observacao: notas || null } })
      toast.success('Nota salva')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao salvar nota'))
    }
  }

  const abrirLabel = referencia?.plataforma ? `Abrir no ${PLATAFORMA_LABELS[referencia.plataforma]}` : 'Abrir link'
  const notasAlteradas = referencia && notas !== (referencia.observacao ?? '')

  return (
    <Sheet open={!!referencia} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        {referencia && (
          <>
            <SheetHeader>
              <SheetTitle>{referencia.titulo}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-5 px-4 pb-6">
              {referencia.thumbnail_url && (
                <img
                  src={referencia.thumbnail_url}
                  alt=""
                  className="aspect-[9/16] w-40 self-center rounded-lg object-cover"
                  referrerPolicy="no-referrer"
                />
              )}

              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                {referencia.plataforma && (
                  <Badge variant="secondary">{PLATAFORMA_LABELS[referencia.plataforma]}</Badge>
                )}
                {referencia.tipo && <Badge variant="secondary">{referencia.tipo}</Badge>}
                {referencia.autor && <span>{formatHandle(referencia.autor)}</span>}
                <span>{formatShortDate(referencia.created_at)}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {referencia.url && (
                  <Button asChild size="sm">
                    <a href={referencia.url} target="_blank" rel="noreferrer">
                      {abrirLabel} ↗
                    </a>
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => onEdit(referencia)}>
                  <Pencil className="size-4" />
                  Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDelete(referencia.id)}>
                  <Trash2 className="size-4" />
                  Excluir
                </Button>
              </div>

              {referencia.resumo && (
                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Resumo</p>
                  <p className="text-sm leading-relaxed">{referencia.resumo}</p>
                </div>
              )}

              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Notas</p>
                <Textarea
                  rows={3}
                  placeholder="Suas anotações sobre essa referência"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                />
                {notasAlteradas && (
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={handleSalvarNotas}
                    disabled={updateReferencia.isPending}
                  >
                    Salvar nota
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
