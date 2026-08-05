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
import { GroupBreakdownChart } from '@/modules/financeiro/components/dashboard/GroupBreakdownChart'
import { AlertBanner } from '@/modules/financeiro/components/dashboard/AlertBanner'
import { useMonth } from '@/modules/financeiro/context/MonthProvider'
import { useMonthlyBudget } from '@/modules/financeiro/hooks/useMonthlyBudget'
import { useIncomeCategories } from '@/modules/financeiro/hooks/useCategories'
import { useMonthTransactions, useTransactionsSince } from '@/modules/financeiro/hooks/useTransactions'
import { useAppSettings, useUpdateAppSettings } from '@/modules/financeiro/hooks/useAppSettings'
import { formatCurrency, formatDateTime } from '@/shared/lib/formatters'
import { todayIso } from '@/modules/financeiro/lib/monthUtils'
import { CATEGORY_GROUP_LABELS } from '@/modules/financeiro/lib/categoryGroups'
import { getErrorMessage } from '@/shared/lib/errors'

export default function DashboardPage() {
  const { selectedMonth } = useMonth()
  const { perGroup, totals } = useMonthlyBudget(selectedMonth)
  const { data: incomeCategories = [] } = useIncomeCategories()
  const { data: settings } = useAppSettings()
  const { data: currentMonthTransactions = [] } = useMonthTransactions(new Date())
  const { data: txSinceReconciliation = [] } = useTransactionsSince(settings?.saldo_atual_em)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const rendaLiquida =
    settings?.renda_liquida_override ??
    incomeCategories.reduce((sum, c) => sum + c.valor_mensal, 0)

  const saldoAtual = useMemo(() => {
    const base = settings?.saldo_atual_conta ?? 0
    const delta = txSinceReconciliation.reduce(
      (sum, t) => sum + t.valor_entrada - t.valor_saida,
      0,
    )
    return base + delta
  }, [settings?.saldo_atual_conta, txSinceReconciliation])

  const limitePercentual = settings?.limite_alerta_percentual ?? 20
  const limiteValor = (rendaLiquida * limitePercentual) / 100

  const today = todayIso()
  const todayTx = currentMonthTransactions.filter((t) => t.data === today)
  const saidasHoje = todayTx.reduce((sum, t) => sum + t.valor_saida, 0)
  const entradasHoje = todayTx.reduce((sum, t) => sum + t.valor_entrada, 0)

  const saldoDoMes = rendaLiquida - totals.realizado

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
        <SummaryCard label="Renda líquida" value={rendaLiquida} index={0} />
        <SummaryCard
          label="Saldo atual"
          value={saldoAtual}
          caption={settings ? `conferido em ${formatDateTime(settings.saldo_atual_em)}` : undefined}
          index={1}
        />
        <SummaryCard
          label="Saldo do mês"
          value={saldoDoMes}
          tone={saldoDoMes >= 0 ? 'positive' : 'negative'}
          index={2}
        />
        <SummaryCard label="Gasto total no mês" value={totals.realizado} index={3} />
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Previsto x Realizado por grupo</CardTitle>
        </CardHeader>
        <CardContent>
          <GroupBreakdownChart data={perGroup} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo do mês</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y p-0">
          {perGroup
            .filter((g) => g.previsto > 0 || g.realizado > 0)
            .map((g) => {
              const diferenca = g.realizado - g.previsto
              const ok = g.previsto === 0 || g.realizado <= g.previsto
              return (
                <div key={g.grupo} className="flex items-center justify-between p-3 text-sm">
                  <span className="font-medium">{CATEGORY_GROUP_LABELS[g.grupo]}</span>
                  <div className="flex items-center gap-3 text-right">
                    <span className="text-muted-foreground">
                      {formatCurrency(g.realizado)} / {formatCurrency(g.previsto)}
                    </span>
                    <span className={ok ? 'text-primary' : 'text-destructive'}>
                      {ok ? 'OK' : `+${formatCurrency(diferenca)}`}
                    </span>
                  </div>
                </div>
              )
            })}
        </CardContent>
      </Card>

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
