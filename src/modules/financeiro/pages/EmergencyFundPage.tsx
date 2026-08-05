import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Progress } from '@/shared/components/ui/progress'
import { FormField } from '@/shared/components/common/FormField'
import { SubmitButton } from '@/shared/components/common/SubmitButton'
import { AnimatedCurrency } from '@/modules/financeiro/components/common/AnimatedCurrency'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import {
  useEmergencyFundConfig,
  useUpdateEmergencyFundConfig,
  useEmergencyFundContributions,
  useAddEmergencyFundContribution,
} from '@/modules/financeiro/hooks/useEmergencyFund'
import { formatCurrency, formatDate, formatPercent } from '@/shared/lib/formatters'
import { todayIso } from '@/modules/financeiro/lib/monthUtils'
import { getErrorMessage } from '@/shared/lib/errors'

export default function EmergencyFundPage() {
  const { data: config } = useEmergencyFundConfig()
  const { data: contributions = [] } = useEmergencyFundContributions()
  const [configOpen, setConfigOpen] = useState(false)
  const [contributionOpen, setContributionOpen] = useState(false)

  const gastos = config?.gastos_mensais_essenciais ?? 0
  const meses = config?.meses_reserva_desejados ?? 0
  const metaTotal = gastos * meses
  const valorGuardado = contributions.reduce((sum, c) => sum + c.aporte, 0)
  const falta = Math.max(metaTotal - valorGuardado, 0)
  const progresso = metaTotal > 0 ? Math.min(valorGuardado / metaTotal, 1) : 0

  const timeline = useMemo(() => {
    let acumulado = 0
    return contributions.map((c) => {
      acumulado += c.aporte
      return { mes: c.mes, aporte: c.aporte, acumulado }
    })
  }, [contributions])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <h1 className="font-display text-2xl font-semibold">Reserva de Emergência</h1>
        <Button variant="outline" size="sm" onClick={() => setConfigOpen(true)}>
          Configurar meta
        </Button>
      </div>

      <Card className="animate-fade-in-up border-l-2 border-l-group-reserva">
        <CardContent className="flex flex-col gap-3 py-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{formatPercent(progresso)}</span>
          </div>
          <Progress value={progresso * 100} className="[&>div]:bg-group-reserva" />
          <div className="grid grid-cols-2 gap-4 pt-2 sm:grid-cols-4">
            <Stat label="Meta total" value={<AnimatedCurrency value={metaTotal} />} />
            <Stat label="Já guardado" value={<AnimatedCurrency value={valorGuardado} className="text-group-reserva" />} />
            <Stat label="Falta" value={<AnimatedCurrency value={falta} />} />
            <Stat label="Meses desejados" value={String(meses)} />
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-in-up" style={{ '--stagger-index': 1 } as CSSProperties}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display text-base">Histórico de aportes</CardTitle>
          <Button size="sm" onClick={() => setContributionOpen(true)}>
            <Plus className="size-4" />
            Aporte
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {timeline.length > 1 && (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis dataKey="mes" tickFormatter={(v) => formatDate(v)} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(v) => formatCurrency(v)} fontSize={11} tickLine={false} axisLine={false} width={80} />
                  <Tooltip
                    labelFormatter={(v) => formatDate(v as string)}
                    formatter={(v) => formatCurrency(Number(v))}
                  />
                  <Line type="monotone" dataKey="acumulado" stroke="var(--group-reserva)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {contributions.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum aporte registrado ainda.
            </p>
          )}

          <div className="flex flex-col divide-y">
            {[...timeline].reverse().map((c, i) => (
              <div
                key={i}
                className="animate-fade-in-up flex items-center justify-between py-2 text-sm transition-colors hover:bg-muted/40"
                style={{ '--stagger-index': i } as CSSProperties}
              >
                <span>{formatDate(c.mes)}</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">Saldo: {formatCurrency(c.acumulado)}</span>
                  <span className="font-medium text-group-reserva">+{formatCurrency(c.aporte)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ConfigDialog open={configOpen} onOpenChange={setConfigOpen} />
      <ContributionDialog open={contributionOpen} onOpenChange={setContributionOpen} />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-sm font-semibold">{value}</p>
    </div>
  )
}

function ConfigDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: config } = useEmergencyFundConfig()
  const updateConfig = useUpdateEmergencyFundConfig()
  const [gastos, setGastos] = useState('')
  const [meses, setMeses] = useState('')

  useEffect(() => {
    if (config && open) {
      setGastos(String(config.gastos_mensais_essenciais))
      setMeses(String(config.meses_reserva_desejados))
    }
  }, [config, open])

  async function handleSave() {
    try {
      await updateConfig.mutateAsync({
        gastos_mensais_essenciais: Number(gastos) || 0,
        meses_reserva_desejados: Number(meses) || 0,
      })
      onOpenChange(false)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao salvar meta'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurar meta da reserva</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <FormField label="Gastos mensais essenciais (R$)" htmlFor="gastos">
            <Input id="gastos" type="number" step="0.01" value={gastos} onChange={(e) => setGastos(e.target.value)} />
          </FormField>
          <FormField label="Meses de reserva desejados" htmlFor="meses">
            <Input id="meses" type="number" step="1" value={meses} onChange={(e) => setMeses(e.target.value)} />
          </FormField>
        </div>
        <DialogFooter>
          <SubmitButton pending={updateConfig.isPending} onClick={handleSave}>
            Salvar
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ContributionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const addContribution = useAddEmergencyFundContribution()
  const [mes, setMes] = useState(todayIso())
  const [aporte, setAporte] = useState('')

  useEffect(() => {
    if (open) {
      setMes(todayIso())
      setAporte('')
    }
  }, [open])

  async function handleSave() {
    if (!aporte) return
    try {
      await addContribution.mutateAsync({ mes, aporte: Number(aporte) })
      onOpenChange(false)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao registrar aporte'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo aporte</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <FormField label="Mês" htmlFor="mes">
            <Input id="mes" type="date" value={mes} onChange={(e) => setMes(e.target.value)} />
          </FormField>
          <FormField label="Valor do aporte (R$)" htmlFor="aporte">
            <Input id="aporte" type="number" step="0.01" value={aporte} onChange={(e) => setAporte(e.target.value)} />
          </FormField>
        </div>
        <DialogFooter>
          <SubmitButton pending={addContribution.isPending} onClick={handleSave}>
            Salvar
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
