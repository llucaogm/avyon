import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { FormField } from '@/shared/components/common/FormField'
import { SubmitButton } from '@/shared/components/common/SubmitButton'
import { usePesoLogs, useAddPesoLog } from '@/modules/habitos/hooks/usePeso'
import { todayIso } from '@/modules/habitos/lib/dateUtils'
import { formatDate } from '@/shared/lib/formatters'
import { getErrorMessage } from '@/shared/lib/errors'

export function PesoSection() {
  const { data: logs = [] } = usePesoLogs()
  const addLog = useAddPesoLog()
  const [peso, setPeso] = useState('')
  const [data, setData] = useState(todayIso())

  const atual = logs[0]

  const chartData = useMemo(
    () =>
      [...logs]
        .reverse()
        .map((l) => ({ data: l.data, peso_kg: l.peso_kg })),
    [logs],
  )

  async function handleSave() {
    const parsed = Number(peso)
    if (!peso || parsed <= 0) return
    try {
      await addLog.mutateAsync({ peso_kg: parsed, data })
      setPeso('')
      setData(todayIso())
    } catch (err) {
      toast.error(getErrorMessage(err, 'Não consegui registrar o peso'))
    }
  }

  return (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <CardTitle className="font-display text-base">Peso</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Peso atual</p>
          <p className="font-display text-2xl font-semibold">
            {atual ? `${atual.peso_kg} kg` : '—'}
            {atual && <span className="ml-2 text-sm font-normal text-muted-foreground">{formatDate(atual.data)}</span>}
          </p>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <FormField label="Peso (kg)" htmlFor="peso-kg">
              <Input
                id="peso-kg"
                type="number"
                step="0.1"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                placeholder="0.0"
              />
            </FormField>
          </div>
          <div className="flex-1">
            <FormField label="Data" htmlFor="peso-data">
              <Input id="peso-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </FormField>
          </div>
          <SubmitButton pending={addLog.isPending} onClick={handleSave}>
            Registrar
          </SubmitButton>
        </div>

        {chartData.length > 1 && (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="data" tickFormatter={(v) => formatDate(v)} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  domain={['dataMin - 1', 'dataMax + 1']}
                  tickFormatter={(v) => `${v}kg`}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                />
                <Tooltip labelFormatter={(v) => formatDate(v as string)} formatter={(v) => `${v} kg`} />
                <Line type="monotone" dataKey="peso_kg" stroke="var(--primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {logs.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">Nenhum peso registrado ainda.</p>
        )}
      </CardContent>
    </Card>
  )
}
