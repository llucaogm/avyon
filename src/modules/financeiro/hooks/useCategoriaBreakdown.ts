import { useMemo } from 'react'
import { useCategorias, type CategoriaTipo } from '@/modules/financeiro/hooks/useCategorias'
import { useMonthTransactions } from '@/modules/financeiro/hooks/useTransactions'
import { CATEGORIA_SEM_COR } from '@/modules/financeiro/lib/categoriaColors'

export interface CategoriaBreakdownItem {
  categoriaId: string | null
  nome: string
  cor: string
  total: number
  count: number
  pct: number
}

/**
 * Realizado por Categoria (despesa ou receita) — sempre derivado dos lançamentos
 * do mês, nunca salvo, mesmo princípio de useMonthlyBudget.ts. Lançamentos sem
 * categoria_id viram o item "Sem categoria" em vez de sumirem do total.
 */
export function useCategoriaBreakdown(monthDate: Date, tipo: CategoriaTipo) {
  const { data: categorias = [], isLoading: loadingCategorias } = useCategorias(tipo)
  const { data: transactions = [], isLoading: loadingTransactions } = useMonthTransactions(monthDate)

  const relevant = useMemo(
    () => transactions.filter((t) => (tipo === 'despesa' ? t.valor_saida > 0 : t.valor_entrada > 0)),
    [transactions, tipo],
  )

  const items = useMemo<CategoriaBreakdownItem[]>(() => {
    const totalGeral = relevant.reduce(
      (sum, t) => sum + (tipo === 'despesa' ? t.valor_saida : t.valor_entrada),
      0,
    )

    const byCategoria = categorias.map((c) => {
      const matching = relevant.filter((t) => t.categoria_id === c.id)
      const total = matching.reduce((sum, t) => sum + (tipo === 'despesa' ? t.valor_saida : t.valor_entrada), 0)
      return {
        categoriaId: c.id,
        nome: c.nome,
        cor: c.cor,
        total,
        count: matching.length,
        pct: totalGeral > 0 ? total / totalGeral : 0,
      }
    })

    const semCategoria = relevant.filter((t) => !t.categoria_id)
    const semCategoriaTotal = semCategoria.reduce(
      (sum, t) => sum + (tipo === 'despesa' ? t.valor_saida : t.valor_entrada),
      0,
    )

    const all =
      semCategoriaTotal > 0
        ? [
            ...byCategoria,
            {
              categoriaId: null,
              nome: 'Sem categoria',
              cor: CATEGORIA_SEM_COR,
              total: semCategoriaTotal,
              count: semCategoria.length,
              pct: totalGeral > 0 ? semCategoriaTotal / totalGeral : 0,
            },
          ]
        : byCategoria

    return all.filter((item) => item.total > 0).sort((a, b) => b.total - a.total)
  }, [categorias, relevant, tipo])

  const total = useMemo(() => items.reduce((sum, i) => sum + i.total, 0), [items])

  return {
    items,
    total,
    isLoading: loadingCategorias || loadingTransactions,
  }
}
