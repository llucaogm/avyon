import { useMemo } from 'react'
import { useEmergencyFundConfig, useEmergencyFundContributions } from '@/modules/financeiro/hooks/useEmergencyFund'

export interface FinancialRunway {
  mesesRunway: number
  progressoBateria: number
  meses: number
  dias: number
  isLoading: boolean
}

/** Patrimônio = saldo ao vivo da conta + tudo já aportado na reserva de emergência. */
export function useFinancialRunway(saldoAtual: number): FinancialRunway {
  const { data: config, isLoading: loadingConfig } = useEmergencyFundConfig()
  const { data: contributions = [], isLoading: loadingContributions } = useEmergencyFundContributions()

  return useMemo(() => {
    const reservaTotal = contributions.reduce((sum, c) => sum + c.aporte, 0)
    const patrimonio = saldoAtual + reservaTotal
    const custoMensalVida = config?.gastos_mensais_essenciais ?? 0
    const mesesRunway = custoMensalVida > 0 ? patrimonio / custoMensalVida : 0
    const metaMeses = config?.meses_reserva_desejados ?? 0
    const progressoBateria = metaMeses > 0 ? Math.min(mesesRunway / metaMeses, 1) : 0
    const meses = Math.floor(mesesRunway)
    const dias = Math.round((mesesRunway - meses) * 30)

    return {
      mesesRunway,
      progressoBateria,
      meses,
      dias,
      isLoading: loadingConfig || loadingContributions,
    }
  }, [saldoAtual, contributions, config, loadingConfig, loadingContributions])
}
