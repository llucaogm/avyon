import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Progress } from '@/shared/components/ui/progress'
import { FormField } from '@/shared/components/common/FormField'
import { SubmitButton } from '@/shared/components/common/SubmitButton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import {
  useGoals,
  useGoalContributions,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useAddGoalContribution,
} from '@/modules/financeiro/hooks/useGoals'
import { AnimatedCurrency } from '@/modules/financeiro/components/common/AnimatedCurrency'
import { formatCurrency, formatPercent } from '@/shared/lib/formatters'
import { todayIso } from '@/modules/financeiro/lib/monthUtils'
import { getErrorMessage } from '@/shared/lib/errors'
import { LoadingState } from '@/shared/components/common/LoadingState'
import { EmptyState } from '@/shared/components/common/EmptyState'
import type { Tables } from '@/shared/types/database.types'

export default function GoalsPage() {
  const { data: goals = [], isLoading } = useGoals()
  const { data: contributions = [] } = useGoalContributions()
  const deleteGoal = useDeleteGoal()
  const [formOpen, setFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Tables<'goals'> | undefined>()
  const [contributingTo, setContributingTo] = useState<Tables<'goals'> | null>(null)

  const savedByGoal = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of contributions) {
      map.set(c.goal_id, (map.get(c.goal_id) ?? 0) + c.valor)
    }
    return map
  }, [contributions])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <h1 className="font-display text-2xl font-semibold">Meus Objetivos</h1>
        <Button
          size="sm"
          onClick={() => {
            setEditingGoal(undefined)
            setFormOpen(true)
          }}
        >
          <Plus className="size-4" />
          Novo objetivo
        </Button>
      </div>

      {isLoading && <LoadingState />}

      {!isLoading && goals.length === 0 && (
        <EmptyState message="Defina, coloque valor e prazo — e vá lá. Crie seu primeiro objetivo." />
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {goals.map((g, index) => {
          const guardado = savedByGoal.get(g.id) ?? 0
          const falta = Math.max(g.valor_total - guardado, 0)
          const porMes = g.prazo_meses > 0 ? falta / g.prazo_meses : 0
          const progresso = g.valor_total > 0 ? Math.min(guardado / g.valor_total, 1) : 0

          return (
            <Card
              key={g.id}
              className="animate-fade-in-up lift-on-hover border-l-2 border-l-group-objetivo"
              style={{ '--stagger-index': index } as CSSProperties}
            >
              <CardHeader>
                <CardTitle className="font-display text-base">{g.nome}</CardTitle>
                <CardAction className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingGoal(g)
                      setFormOpen(true)
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      deleteGoal.mutate(g.id, {
                        onError: () => toast.error('Não consegui excluir esse objetivo'),
                      })
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Progress value={progresso * 100} className="[&>div]:bg-group-objetivo" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{formatPercent(progresso)}</span>
                  <span>
                    <AnimatedCurrency value={guardado} /> / {formatCurrency(g.valor_total)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Falta</p>
                    <p className="font-display font-medium">{formatCurrency(falta)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Por mês ({g.prazo_meses}m)</p>
                    <p className="font-display font-medium">{formatCurrency(porMes)}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setContributingTo(g)}>
                  <Plus className="size-4" />
                  Registrar valor guardado
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <GoalFormDialog open={formOpen} onOpenChange={setFormOpen} goal={editingGoal} />
      <ContributionDialog goal={contributingTo} onOpenChange={(v) => !v && setContributingTo(null)} />
    </div>
  )
}

function GoalFormDialog({
  open,
  onOpenChange,
  goal,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  goal?: Tables<'goals'>
}) {
  const createGoal = useCreateGoal()
  const updateGoal = useUpdateGoal()
  const isEditing = !!goal
  const [nome, setNome] = useState('')
  const [valorTotal, setValorTotal] = useState('')
  const [prazo, setPrazo] = useState('12')

  useEffect(() => {
    if (open) {
      setNome(goal?.nome ?? '')
      setValorTotal(goal ? String(goal.valor_total) : '')
      setPrazo(goal ? String(goal.prazo_meses) : '12')
    }
  }, [open, goal])

  async function handleSave() {
    if (!nome || !valorTotal) return
    try {
      const payload = {
        nome,
        valor_total: Number(valorTotal),
        prazo_meses: Number(prazo) || 1,
      }
      if (isEditing) {
        await updateGoal.mutateAsync({ id: goal.id, values: payload })
        toast.success('Objetivo atualizado')
      } else {
        await createGoal.mutateAsync(payload)
        toast.success('Objetivo criado')
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao salvar objetivo'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar objetivo' : 'Novo objetivo'}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <FormField label="Nome do objetivo" htmlFor="nome">
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </FormField>
          <FormField label="Valor total (R$)" htmlFor="valorTotal">
            <Input
              id="valorTotal"
              type="number"
              step="0.01"
              value={valorTotal}
              onChange={(e) => setValorTotal(e.target.value)}
            />
          </FormField>
          <FormField label="Prazo (meses)" htmlFor="prazo">
            <Input id="prazo" type="number" step="1" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
          </FormField>
        </div>
        <DialogFooter>
          <SubmitButton pending={createGoal.isPending || updateGoal.isPending} onClick={handleSave}>
            Salvar
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ContributionDialog({
  goal,
  onOpenChange,
}: {
  goal: Tables<'goals'> | null
  onOpenChange: (v: boolean) => void
}) {
  const addContribution = useAddGoalContribution()
  const [valor, setValor] = useState('')
  const [data, setData] = useState(todayIso())

  useEffect(() => {
    if (goal) {
      setValor('')
      setData(todayIso())
    }
  }, [goal])

  async function handleSave() {
    if (!goal || !valor) return
    try {
      await addContribution.mutateAsync({ goal_id: goal.id, valor: Number(valor), data })
      onOpenChange(false)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao registrar valor guardado'))
    }
  }

  return (
    <Dialog open={!!goal} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar valor guardado{goal ? ` — ${goal.nome}` : ''}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <FormField label="Valor (R$)" htmlFor="valor">
            <Input id="valor" type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
          </FormField>
          <FormField label="Data" htmlFor="data">
            <Input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
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
