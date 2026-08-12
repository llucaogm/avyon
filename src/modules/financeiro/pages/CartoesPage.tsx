import { useMemo, useState, type CSSProperties } from 'react'
import { Plus, Pencil, Trash2, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { useCartoes, useCartaoTransacoes, useDeleteCartao } from '@/modules/financeiro/hooks/useCartoes'
import { computeCartaoSaldo } from '@/modules/financeiro/lib/cartaoSaldo'
import { CartaoFormDialog } from '@/modules/financeiro/components/cartoes/CartaoFormDialog'
import { PagarFaturaDialog } from '@/modules/financeiro/components/cartoes/PagarFaturaDialog'
import { CartaoVisual } from '@/modules/financeiro/components/cartoes/CartaoVisual'
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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Cartões</h1>
        <p className="text-sm text-muted-foreground">
          Contas de débito têm saldo próprio (a soma delas é o seu saldo geral); cartões de crédito só
          controlam limite disponível.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Débito</h2>
          <Button size="sm" onClick={() => openNew('debito')}>
            <Plus className="size-4" />
            Novo
          </Button>
        </div>

        {loadingDebitos && <LoadingState />}
        {!loadingDebitos && debitos.length === 0 && (
          <EmptyState message="Nenhum cartão de débito ainda. Adicione o primeiro." />
        )}

        <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          {debitos.map((c, index) => (
            <div
              key={c.id}
              className="animate-fade-in-up flex flex-col gap-2"
              style={{ '--stagger-index': index } as CSSProperties}
            >
              <CartaoVisual cartao={c} />
              <div className="flex items-center justify-between px-1">
                <div>
                  <p className="text-xs text-muted-foreground">Saldo</p>
                  <p className="text-sm font-semibold">{formatCurrency(saldosById.get(c.id) ?? 0)}</p>
                </div>
                <div className="flex gap-1">
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
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Crédito</h2>
          <Button size="sm" onClick={() => openNew('credito')}>
            <Plus className="size-4" />
            Novo
          </Button>
        </div>

        {loadingCreditos && <LoadingState />}
        {!loadingCreditos && creditos.length === 0 && (
          <EmptyState message="Nenhum cartão de crédito ainda. Adicione o primeiro." />
        )}

        <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          {creditos.map((c, index) => (
            <div
              key={c.id}
              className="animate-fade-in-up flex flex-col gap-2"
              style={{ '--stagger-index': index } as CSSProperties}
            >
              <CartaoVisual cartao={c} />
              <div className="flex items-center justify-between px-1">
                <div>
                  <p className="text-xs text-muted-foreground">Disponível de {formatCurrency(c.limite ?? 0)}</p>
                  <p className="text-sm font-semibold">{formatCurrency(saldosById.get(c.id) ?? 0)}</p>
                </div>
                <div className="flex gap-1">
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
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                disabled={debitos.length === 0}
                title={debitos.length === 0 ? 'Cadastre um cartão de débito primeiro' : undefined}
                onClick={() => setFaturaCartao(c)}
              >
                <Receipt className="size-4" />
                Pagar fatura
              </Button>
            </div>
          ))}
        </div>
      </section>

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
