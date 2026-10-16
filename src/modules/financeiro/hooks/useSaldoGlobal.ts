import { useMemo } from 'react'
import { useAppSettings } from '@/modules/financeiro/hooks/useAppSettings'
import { useTransactionsSince } from '@/modules/financeiro/hooks/useTransactions'

/** Saldo da conta: o último valor conferido (app_settings.saldo_atual_conta)
 * mais tudo o que foi lançado depois dessa conferência. */
export function useSaldoGlobal() {
  const { data: settings, isLoading: loadingSettings } = useAppSettings()
  const { data: txSinceReconciliation = [], isLoading: loadingSince } = useTransactionsSince(settings?.saldo_atual_em)

  const saldo = useMemo(() => {
    const base = settings?.saldo_atual_conta ?? 0
    const delta = txSinceReconciliation.reduce((sum, t) => sum + t.valor_entrada - t.valor_saida, 0)
    return base + delta
  }, [settings?.saldo_atual_conta, txSinceReconciliation])

  return { saldo, isLoading: loadingSettings || loadingSince }
}
