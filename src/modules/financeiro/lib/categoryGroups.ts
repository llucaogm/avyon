import type { Enums } from '@/shared/types/database.types'

/** Single source of truth for the 4 expense-category groups — was previously
 * copy-pasted as `Record<string, string>` across 5 files, each one a chance
 * to drift out of sync with the actual `category_group` enum. */
export type CategoryGroup = Enums<'category_group'>

export const CATEGORY_GROUP_ORDER: readonly CategoryGroup[] = [
  'fixo',
  'variavel',
  'objetivo',
  'reserva',
]

export const CATEGORY_GROUP_LABELS: Record<CategoryGroup, string> = {
  fixo: 'Fixo',
  variavel: 'Variável',
  objetivo: 'Objetivo',
  reserva: 'Reserva',
}

/** Each group gets its own stop along the brand teal→blue ramp, rather than
 * one accent for everything. */
export const CATEGORY_GROUP_ACCENT: Record<CategoryGroup, string> = {
  fixo: 'var(--group-fixo)',
  variavel: 'var(--group-variavel)',
  objetivo: 'var(--group-objetivo)',
  reserva: 'var(--group-reserva)',
}
