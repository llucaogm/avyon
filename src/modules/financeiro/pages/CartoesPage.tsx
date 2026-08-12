import { useMemo, useState, type CSSProperties } from 'react'
import { Plus, Pencil, Trash2, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { useCartoes, useCartaoTransacoes, useDeleteCartao } from '@/modules/financeiro/hooks/useCartoes'
import { computeCartaoSaldo } from '@/modules/financeiro/lib/cartaoSaldo'
import { CartaoFormDialog } from '@/modules/financeiro/components/cartoes/CartaoFormDialog'
import { PagarFaturaDialog } from '@/modules/financeiro/components/cartoes/PagarFaturaDialog'
import { LoadingState } from '@/shared/components/common/LoadingState'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { formatCurrency } from '@/shared/lib/formatters'
import type { Enums, Tables } from '@/shared/types/database.types'

type CartaoTipo = Enums<'cartao_tipo'>

export default function CartoesPage() {
  const { data: debitos = [], isLoading: loadingDebitos } = useCartoes('debito')
  const { data: creditos = [], isLoading: loadingCreditos } = useCartoes('credito')
  const { data: transacoes = [] } = useCartaoTransacoes()
  const deleteCartao = useDeleteCartao()

  const [formOpen, setFormOpen] = useState(false)
  const [formTipo, setFormTipo] = useState<CartaoTipo>('debito')
  const [editing, setEditing] = useState<Tables<'cartoes'> | undefined>()
  const [faturaCartao, setFaturaCartao] = useState<Tables<'cartoes'> | undefined>()

  const saldosById = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of [...debitos, ...creditos]) map.set(c.id, computeCartaoSaldo(c, transacoes))
    return map
  }, [debitos, creditos, transacoes])

  function openNew(tipo: CartaoTipo) {
    setFormTipo(tipo)
    setEditing(undefined)
    setFormOpen(true)
  }

  function openEdit(cartao: Tables<'cartoes'>) {
    setFormTipo(cartao.tipo)
    setEditing(cartao)
    setFormOpen(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Cartões</h1>
        <p className="text-sm text-muted-foreground">
          Contas de débito têm saldo próprio (a soma delas é o seu saldo geral); cartões de crédito só
          controlam limite disponível.
        </p>
      </div>

      <Card className="animate-fade-in-up" style={{ '--stagger-index': 0 } as CSSProperties}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Débito</CardTitle>
          <Button size="sm" onClick={() => openNew('debito')}>
            <Plus className="size-4" />
            Novo
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {loadingDebitos && <LoadingState />}
          {!loadingDebitos && debitos.length === 0 && (
            <EmptyState message="Nenhum cartão de débito ainda. Adicione o primeiro." />
          )}
          {debitos.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.cor }} />
                <div>
                  <p className="font-medium">{c.nome}</p>
                  <p className="text-xs text-muted-foreground">Saldo</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{formatCurrency(saldosById.get(c.id) ?? 0)}</span>
                <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    deleteCartao.mutate(c.id, { onError: () => toast.error('Não consegui excluir esse cartão') })
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="animate-fade-in-up" style={{ '--stagger-index': 1 } as CSSProperties}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Crédito</CardTitle>
          <Button size="sm" onClick={() => openNew('credito')}>
            <Plus className="size-4" />
            Novo
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {loadingCreditos && <LoadingState />}
          {!loadingCreditos && creditos.length === 0 && (
            <EmptyState message="Nenhum cartão de crédito ainda. Adicione o primeiro." />
          )}
          {creditos.map((c) => (
            <div
              key={c.id}
              className="flex flex-col gap-2 rounded-md border p-3 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.cor }} />
                <div>
                  <p className="font-medium">{c.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    Disponível de {formatCurrency(c.limite ?? 0)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{formatCurrency(saldosById.get(c.id) ?? 0)}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={debitos.length === 0}
                  title={debitos.length === 0 ? 'Cadastre um cartão de débito primeiro' : undefined}
                  onClick={() => setFaturaCartao(c)}
                >
                  <Receipt className="size-4" />
                  Pagar fatura
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    deleteCartao.mutate(c.id, { onError: () => toast.error('Não consegui excluir esse cartão') })
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <CartaoFormDialog open={formOpen} onOpenChange={setFormOpen} cartao={editing} tipo={formTipo} />
      {faturaCartao && (
        <PagarFaturaDialog
          open={!!faturaCartao}
          onOpenChange={(v) => !v && setFaturaCartao(undefined)}
          cartaoCredito={faturaCartao}
        />
      )}
    </div>
  )
}
