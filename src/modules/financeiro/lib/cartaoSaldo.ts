import type { Tables } from '@/shared/types/database.types'

type CartaoTransacao = Pick<Tables<'transactions'>, 'cartao_id' | 'valor_entrada' | 'valor_saida' | 'created_at'>

/**
 * Débito soma apenas o que aconteceu desde a última reconciliação (mesmo padrão
 * de `app_settings.saldo_atual_conta`, só que por cartão). Crédito soma todo o
 * histórico sem janela — um gasto reduz o disponível pra sempre até uma `entrada`
 * (pagamento de fatura) devolver.
 */
export function computeCartaoSaldo(cartao: Tables<'cartoes'>, transacoes: CartaoTransacao[]): number {
  const reconciliadoEm = new Date(cartao.saldo_reconciliado_em)
  const relevantes = transacoes.filter(
    (t) => t.cartao_id === cartao.id && (cartao.tipo === 'credito' || new Date(t.created_at) > reconciliadoEm),
  )

  if (cartao.tipo === 'debito') {
    return cartao.saldo_reconciliado + relevantes.reduce((sum, t) => sum + t.valor_entrada - t.valor_saida, 0)
  }

  return (cartao.limite ?? 0) - relevantes.reduce((sum, t) => sum + t.valor_saida - t.valor_entrada, 0)
}
