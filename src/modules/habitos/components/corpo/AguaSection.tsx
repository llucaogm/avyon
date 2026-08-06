import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { format, subDays } from 'date-fns'
import { Settings } from 'lucide-react'
import { toast } from 'sonner'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Progress } from '@/shared/components/ui/progress'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { FormField } from '@/shared/components/common/FormField'
import { SubmitButton } from '@/shared/components/common/SubmitButton'
import { ConfirmCheck } from '@/shared/components/common/ConfirmCheck'
import { useCountUp } from '@/shared/hooks/useCountUp'
import { useAguaLogs, useAddAguaLog, useAguaConfig, useUpdateAguaConfig } from '@/modules/habitos/hooks/useAgua'
import { todayIso } from '@/modules/habitos/lib/dateUtils'
import { getErrorMessage } from '@/shared/lib/errors'

const QUICK_ADD = [250, 500, 1000]
const HISTORY_DAYS = 14

function AnimatedMl({ value }: { value: number }) {
  const animated = useCountUp(value)
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.round(animated)} ml</span>
}

export function AguaSection() {
  const { data: logs = [] } = useAguaLogs()
  const { data: config } = useAguaConfig()
  const addLog = useAddAguaLog()
  const [justAdded, setJustAdded] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const today = todayIso()
  const totalHoje = useMemo(() => logs.filter((l) => l.data === today).reduce((sum, l) => sum + l.ml, 0), [logs, today])
  const meta = config?.meta_agua_ml ?? 2000
  const progresso = meta > 0 ? Math.min(totalHoje / meta, 1) : 0

  const chartData = useMemo(() => {
    const totals = new Map<string, number>()
    for (const l of logs) totals.set(l.data, (totals.get(l.data) ?? 0) + l.ml)
    const days: { dia: string; ml: number }[] = []
    for (let i = HISTORY_DAYS - 1; i >= 0; i--) {
      const d = subDays(new Date(), i)
      const iso = format(d, 'yyyy-MM-dd')
      days.push({ dia: format(d, 'dd/MM'), ml: totals.get(iso) ?? 0 })
    }
    return days
  }, [logs])

  function handleAdd(ml: number) {
    addLog.mutate(ml, {
      onSuccess: () => {
        setJustAdded(true)
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setJustAdded(false), 900)
      },
      onError: (err) => toast.error(getErrorMessage(err, 'Não consegui registrar a água')),
    })
  }

  return (
    <Card className="animate-fade-in-up">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display text-base">Água</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setConfigOpen(true)}>
          <Settings className="size-4" />
          Meta
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div
          className={justAdded ? 'animate-wash flex flex-col gap-2 rounded-md p-2' : 'flex flex-col gap-2 p-2'}
          style={{ '--wash-color': 'var(--primary)' } as CSSProperties}
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-lg font-semibold">
              <AnimatedMl value={totalHoje} /> <span className="text-sm font-normal text-muted-foreground">/ {meta} ml</span>
            </span>
            {justAdded && <ConfirmCheck color="var(--primary)" />}
          </div>
          <Progress value={progresso * 100} />
        </div>

        <div className="flex gap-2">
          {QUICK_ADD.map((ml) => (
            <Button key={ml} variant="outline" size="sm" className="flex-1" onClick={() => handleAdd(ml)}>
              +{ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}
            </Button>
          ))}
        </div>

        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
              <XAxis dataKey="dia" tickLine={false} axisLine={false} fontSize={10} interval={1} />
              <YAxis tickLine={false} axisLine={false} fontSize={10} width={40} />
              <Tooltip formatter={(v) => `${v} ml`} />
              <Bar dataKey="ml" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>

      <ConfigMetaDialog open={configOpen} onOpenChange={setConfigOpen} />
    </Card>
  )
}

function ConfigMetaDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: config } = useAguaConfig()
  const updateConfig = useUpdateAguaConfig()
  const [meta, setMeta] = useState('')

  useEffect(() => {
    if (config && open) setMeta(String(config.meta_agua_ml))
  }, [config, open])

  async function handleSave() {
    const parsed = Number(meta)
    if (!meta || parsed <= 0) return
    try {
      await updateConfig.mutateAsync({ meta_agua_ml: parsed })
      onOpenChange(false)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Não consegui salvar a meta'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Meta diária de água</DialogTitle>
        </DialogHeader>
        <FormField label="Meta (ml)" htmlFor="meta-agua">
          <Input
            id="meta-agua"
            type="number"
            step="50"
            value={meta}
            onChange={(e) => setMeta(e.target.value)}
            placeholder="2000"
          />
        </FormField>
        <DialogFooter>
          <SubmitButton pending={updateConfig.isPending} onClick={handleSave}>
            Salvar
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
