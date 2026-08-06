import type { Tables } from '@/shared/types/database.types'

type Transaction = Tables<'transactions'>
type SuggestableField = 'expense_category_id' | 'income_category_id' | 'categoria_id'

/**
 * Suggests a category (Gasto Fixo, Receita Fixa, or Categoria — any nullable
 * category-like FK on transactions) based on how similar past descriptions were
 * tagged. Naive token-overlap heuristic — good enough while transaction history
 * is small; revisit with a pg_trgm similarity RPC if suggestions feel weak once
 * there's more data.
 */
export function suggestCategory(
  descricao: string,
  recentTransactions: Transaction[],
  field: SuggestableField,
): string | null {
  const query = descricao.trim().toLowerCase()
  if (query.length < 2) return null

  const candidates = recentTransactions.filter(
    (t) => t[field] && t.descricao.toLowerCase().includes(query),
  )
  if (candidates.length === 0) {
    const queryTokens = query.split(/\s+/)
    const tokenMatches = recentTransactions.filter(
      (t) =>
        t[field] &&
        queryTokens.some((tok) => tok.length > 2 && t.descricao.toLowerCase().includes(tok)),
    )
    if (tokenMatches.length === 0) return null
    return mostFrequentCategory(tokenMatches, field)
  }

  return mostFrequentCategory(candidates, field)
}

function mostFrequentCategory(transactions: Transaction[], field: SuggestableField): string | null {
  const counts = new Map<string, number>()
  for (const t of transactions) {
    const value = t[field]
    if (!value) continue
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  let best: string | null = null
  let bestCount = 0
  for (const [categoryId, count] of counts) {
    if (count > bestCount) {
      best = categoryId
      bestCount = count
    }
  }
  return best
}
