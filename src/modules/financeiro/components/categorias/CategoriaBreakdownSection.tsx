import { useState } from 'react'
import { Plus, Settings, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'
import { LoadingState } from '@/shared/components/common/LoadingState'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { CategoriaDonutChart } from '@/modules/financeiro/components/categorias/CategoriaDonutChart'
import { CategoriaFormDialog } from '@/modules/financeiro/components/categorias/CategoriaFormDialog'
import { useCategoriaBreakdown } from '@/modules/financeiro/hooks/useCategoriaBreakdown'
import {
  useCategorias,
  useUpdateCategoria,
  useDeleteCategoria,
  type CategoriaTipo,
} from '@/modules/financeiro/hooks/useCategorias'
import { formatCurrency, formatPercent } from '@/shared/lib/formatters'
import type { Tables } from '@/shared/types/database.types'

export function CategoriaBreakdownSection({ tipo, monthDate }: { tipo: CategoriaTipo; monthDate: Date }) {
  const { items, total, isLoading } = useCategoriaBreakdown(monthDate, tipo)
  const { data: categorias = [] } = useCategorias(tipo)
  const updateCategoria = useUpdateCategoria()
  const deleteCategoria = useDeleteCategoria()
  const [manageOpen, setManageOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Tables<'categorias'> | undefined>()

  function swapOrder(a: Tables<'categorias'>, b: Tables<'categorias'>) {
    updateCategoria.mutate({ id: a.id, values: { ordem: b.ordem } })
    updateCategoria.mutate({ id: b.id, values: { ordem: a.ordem } })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setManageOpen(true)}>
          <Settings className="size-4" />
          Gerenciar categorias
        </Button>
      </div>

      {isLoading && <LoadingState />}

      {!isLoading && items.length === 0 && (
        <EmptyState message="Nenhum lançamento categorizado neste mês." />
      )}

      {items.length > 0 && (
        <>
          <Card className="animate-fade-in-up">
            <CardContent className="py-6">
              <CategoriaDonutChart items={items} total={total} />
            </CardContent>
          </Card>

          <Card className="animate-fade-in-up">
            <CardContent className="flex flex-col divide-y p-0">
              {items.map((item) => (
                <div
                  key={item.categoriaId ?? 'sem-categoria'}
                  className="flex items-center justify-between p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.cor }} />
                    <span className="text-sm font-medium">{item.nome}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-xs text-muted-foreground">{item.count}x</span>
                    <Badge variant="secondary">{formatPercent(item.pct)}</Badge>
                    <span className="font-medium">{formatCurrency(item.total)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      <Sheet open={manageOpen} onOpenChange={setManageOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Gerenciar categorias</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4 pb-6">
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => {
                  setEditing(undefined)
                  setDialogOpen(true)
                }}
              >
                <Plus className="size-4" />
                Nova categoria
              </Button>
            </div>

            {categorias.length === 0 && <EmptyState message="Nenhuma categoria cadastrada ainda." />}

            {categorias.length > 0 && (
              <div className="flex flex-col divide-y">
                {categorias.map((c, index) => (
                  <div key={c.id} className="flex items-center gap-2 py-2">
                    <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: c.cor }} />
                    <span className="flex-1 text-sm">{c.nome}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={index === 0}
                      onClick={() => swapOrder(c, categorias[index - 1])}
                    >
                      <ChevronUp className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={index === categorias.length - 1}
                      onClick={() => swapOrder(c, categorias[index + 1])}
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(c)
                        setDialogOpen(true)
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        deleteCategoria.mutate(c.id, {
                          onError: () => toast.error('Não consegui excluir essa categoria'),
                        })
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <CategoriaFormDialog open={dialogOpen} onOpenChange={setDialogOpen} categoria={editing} tipo={tipo} />
    </div>
  )
}
