import type { Tables } from '@/shared/types/database.types'

type Transaction = Tables<'transactions'>

/**
 * Suggests an expense category based on how similar past descriptions were categorized.
 * Naive token-overlap heuristic — good enough while transaction history is small;
 * revisit with a pg_trgm similarity RPC if suggestions feel weak once there's more data.
 */
export function suggestExpenseCategory(
  descricao: string,
  recentTransactions: Transaction[],
): string | null {
  const query = descricao.trim().toLowerCase()
  if (query.length < 2) return null

  const candidates = recentTransactions.filter(
    (t) => t.expense_category_id && t.descricao.toLowerCase().includes(query),
  )
  if (candidates.length === 0) {
    const queryTokens = query.split(/\s+/)
    const tokenMatches = recentTransactions.filter(
      (t) =>
        t.expense_category_id &&
        queryTokens.some((tok) => tok.length > 2 && t.descricao.toLowerCase().includes(tok)),
    )
    if (tokenMatches.length === 0) return null
    return mostFrequentCategory(tokenMatches)
  }

  return mostFrequentCategory(candidates)
}

function mostFrequentCategory(transactions: Transaction[]): string | null {
  const counts = new Map<string, number>()
  for (const t of transactions) {
    if (!t.expense_category_id) continue
    counts.set(t.expense_category_id, (counts.get(t.expense_category_id) ?? 0) + 1)
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
