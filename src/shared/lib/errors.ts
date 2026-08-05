import type { User } from '@supabase/supabase-js'

/** Was copy-pasted as `err instanceof Error ? err.message : '<fallback>'` in 11 places. */
export function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

/** Was copy-pasted as `if (!user) throw new Error('Não autenticado')` in every mutation hook. */
export function requireUser(user: User | null): asserts user is User {
  if (!user) throw new Error('Não autenticado')
}
