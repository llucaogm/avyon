import { useEffect, useMemo, useState } from 'react'
import { Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { FormField } from '@/shared/components/common/FormField'
import { SubmitButton } from '@/shared/components/common/SubmitButton'
import { MonthSwitcher } from '@/modules/financeiro/components/layout/MonthSwitcher'
import { SummaryCard } from '@/modules/financeiro/components/dashboard/SummaryCard'
import { AlertBanner } from '@/modules/financeiro/components/dashboard/AlertBanner'
import { SpendingPaceThermometer } from '@/modules/financeiro/components/dashboard/SpendingPaceThermometer'
import { RunwayCard } from '@/modules/financeiro/components/dashboard/RunwayCard'
import { CashFlowCard } from '@/modules/financeiro/components/dashboard/CashFlowCard'
import { FixedVsFlexibleMatrix } from '@/modules/financeiro/components/dashboard/FixedVsFlexibleMatrix'
import { UpcomingDueList } from '@/modules/financeiro/components/dashboard/UpcomingDueList'
import { RecentTransactionsList } from '@/modules/financeiro/components/dashboard/RecentTransactionsList'
import { useMonth } from '@/modules/financeiro/context/MonthProvider'
import { useMonthlyBudget } from '@/modules/financeiro/hooks/useMonthlyBudget'
import { useFinancialHealth } from '@/modules/financeiro/hooks/useFinancialHealth'
import { useIncomeCategories } from '@/modules/financeiro/hooks/useCategories'
import { useMonthTransactions } from '@/modules/financeiro/hooks/useTransactions'
import { useAppSettings, useUpdateAppSettings } from '@/modules/financeiro/hooks/useAppSettings'
import { useCartoes, useCartaoTransacoes, useSaldoGlobal } from '@/modules/financeiro/hooks/useCartoes'
import { computeCartaoSaldo } from '@/modules/financeiro/lib/cartaoSaldo'
import { formatCurrency } from '@/shared/lib/formatters'
import { todayIso } from '@/modules/financeiro/lib/monthUtils'
import { getErrorMessage } from '@/shared/lib/errors'

export default function DashboardPage() {
  const { selectedMonth } = useMonth()
  const { totals } = useMonthlyBudget(selectedMonth)
  const { data: incomeCategories = [] } = useIncomeCategories()
  const { data: settings } = useAppSettings()
  const { data: currentMonthTransactions = [] } = useMonthTransactions(new Date())
  const { saldo: saldoAtual } = useSaldoGlobal()
  const { data: cartoes = [] } = useCartoes()
  const { data: cartaoTransacoes = [] } = useCartaoTransacoes()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const rendaLiquida =
    settings?.renda_liquida_override ??
    incomeCategories.reduce((sum, c) => sum + c.valor_mensal, 0)

  const health = useFinancialHealth(selectedMonth)

  // Sums to exactly this month's total saídas — custosFixos + investido +
  // gastoFlexivelRealizado always covers every transaction (each belongs to exactly
  // one grupo, or none = avulso, which gastoFlexivelRealizado already includes).
  const entradasMes = health.entradasRealizadas
  const saidasMes = health.custosFixos + health.investido + health.gastoFlexivelRealizado

  const limitePercentual = settings?.limite_alerta_percentual ?? 20
  const limiteValor = (rendaLiquida * limitePercentual) / 100

  const today = todayIso()
  const todayTx = currentMonthTransactions.filter((t) => t.data === today)
  const saidasHoje = todayTx.reduce((sum, t) => sum + t.valor_saida, 0)
  const entradasHoje = todayTx.reduce((sum, t) => sum + t.valor_entrada, 0)

  const showAlert = useMemo(() => {
    if (rendaLiquida <= 0) return false
    return totals.realizado > limiteValor
  }, [rendaLiquida, totals.realizado, limiteValor])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Início</h1>
          <MonthSwitcher />
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
          <Settings2 className="size-5" />
        </Button>
      </div>

      {showAlert && (
        <AlertBanner
          message={`Seus gastos já passaram do limite de alerta (${formatCurrency(limiteValor)}).`}
        />
      )}

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <SummaryCard label="Saldo geral" value={saldoAtual} index={0} />
        <SummaryCard label="Entradas do mês" value={entradasMes} tone="positive" index={1} />
        <SummaryCard label="Saídas do mês" value={saidasMes} tone="negative" index={2} />
        <SummaryCard
          label="Saldo livre"
          value={health.restanteFlexivel}
          tone={health.restanteFlexivel >= 0 ? 'positive' : 'negative'}
          index={3}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gastos de hoje</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Saídas</p>
            <p className="text-sm font-semibold text-destructive">{formatCurrency(saidasHoje)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Entradas</p>
            <p className="text-sm font-semibold text-primary">{formatCurrency(entradasHoje)}</p>
          </div>
        </CardContent>
      </Card>

      <SpendingPaceThermometer />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <RunwayCard saldoAtual={saldoAtual} />
        <CashFlowCard
          comprometido={health.custosFixos}
          investido={health.investido}
          livre={health.restanteFlexivel}
        />
        <FixedVsFlexibleMatrix percentualComprometido={health.percentualComprometido} />
      </div>

      {cartoes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cartões</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {cartoes.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ backgroundColor: c.cor }} />
                  {c.nome}
                  <span className="text-xs text-muted-foreground">
                    {c.tipo === 'credito' ? '· disponível' : '· débito'}
                  </span>
                </span>
                <span className="font-medium">{formatCurrency(computeCartaoSaldo(c, cartaoTransacoes))}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <UpcomingDueList />
      <RecentTransactionsList />

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  )
}

function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: settings } = useAppSettings()
  const updateSettings = useUpdateAppSettings()
  const [saldo, setSaldo] = useState('')
  const [limite, setLimite] = useState('')

  useEffect(() => {
    if (settings) {
      setSaldo(String(settings.saldo_atual_conta))
      setLimite(String(settings.limite_alerta_percentual))
    }
  }, [settings])

  async function handleSave() {
    try {
      await updateSettings.mutateAsync({
        saldo_atual_conta: Number(saldo) || 0,
        limite_alerta_percentual: Number(limite) || 0,
        saldo_atual_em: new Date().toISOString(),
      })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao salvar configurações'))
      return
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurações globais</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <FormField label="Saldo atual na conta (R$)" htmlFor="saldo">
            <Input id="saldo" type="number" step="0.01" value={saldo} onChange={(e) => setSaldo(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Confira esse valor com seu extrato de vez em quando. Entre uma conferência e outra, o
              app soma sozinho as entradas e saídas que você for lançando.
            </p>
          </FormField>
          <FormField label="Limite de alerta (% da renda)" htmlFor="limite">
            <Input id="limite" type="number" step="1" value={limite} onChange={(e) => setLimite(e.target.value)} />
          </FormField>
        </div>
        <DialogFooter>
          <SubmitButton pending={updateSettings.isPending} onClick={handleSave}>
            Salvar
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
