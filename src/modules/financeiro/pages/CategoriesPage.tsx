import { useState, type CSSProperties } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import {
  useExpenseCategories,
  useIncomeCategories,
  useDeleteExpenseCategory,
  useDeleteIncomeCategory,
} from '@/modules/financeiro/hooks/useCategories'
import { ExpenseCategoryDialog } from '@/modules/financeiro/components/categories/ExpenseCategoryDialog'
import { IncomeCategoryDialog } from '@/modules/financeiro/components/categories/IncomeCategoryDialog'
import { LoadingState } from '@/shared/components/common/LoadingState'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { formatCurrency, formatPercent } from '@/shared/lib/formatters'
import { CATEGORY_GROUP_LABELS, CATEGORY_GROUP_ORDER, CATEGORY_GROUP_ACCENT } from '@/modules/financeiro/lib/categoryGroups'
import type { Tables } from '@/shared/types/database.types'

export default function CategoriesPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Categorias</h1>
        <p className="text-sm text-muted-foreground">
          Edite os nomes e valores abaixo. Lançamentos e relatórios de todo o app atualizam sozinhos.
        </p>
      </div>

      <Tabs defaultValue="despesas">
        <TabsList>
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
          <TabsTrigger value="receitas">Receitas</TabsTrigger>
        </TabsList>
        <TabsContent value="despesas" className="mt-4">
          <ExpensesTab />
        </TabsContent>
        <TabsContent value="receitas" className="mt-4">
          <IncomeTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ExpensesTab() {
  const { data: categories = [], isLoading } = useExpenseCategories()
  const { data: incomeCategories = [] } = useIncomeCategories()
  const deleteCategory = useDeleteExpenseCategory()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Tables<'expense_categories'> | undefined>()

  const rendaTotal = incomeCategories.reduce((sum, c) => sum + c.valor_mensal, 0)

  const totalsByGroup = CATEGORY_GROUP_ORDER.map((grupo) => ({
    grupo,
    total: categories.filter((c) => c.grupo === grupo).reduce((sum, c) => sum + c.valor_mensal, 0),
  }))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="size-4" />
          Nova despesa
        </Button>
      </div>

      {isLoading && <LoadingState />}

      {!isLoading && categories.length === 0 && (
        <EmptyState message="Nenhuma categoria de despesa ainda. Adicione a primeira." />
      )}

      {CATEGORY_GROUP_ORDER.map((grupo, groupIndex) => {
        const items = categories.filter((c) => c.grupo === grupo)
        if (items.length === 0) return null
        const accent = CATEGORY_GROUP_ACCENT[grupo]
        return (
          <Card
            key={grupo}
            className="animate-fade-in-up border-l-2"
            style={{ '--stagger-index': groupIndex, borderLeftColor: accent } as CSSProperties}
          >
            <CardHeader>
              <CardTitle className="text-base">{CATEGORY_GROUP_LABELS[grupo]}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {items.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-muted/40"
                >
                  <div>
                    <p className="font-medium">{c.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(c.valor_mensal)} · {c.frequencia}
                      {c.end_date ? ` · termina ${c.end_date}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(c)
                        setDialogOpen(true)
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        deleteCategory.mutate(c.id, {
                          onError: () => toast.error('Não consegui excluir essa categoria'),
                        })
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )
      })}

      {categories.length > 0 && (
        <Card className="animate-fade-in-up" style={{ '--stagger-index': 4 } as CSSProperties}>
          <CardHeader>
            <CardTitle className="text-base">Totais por grupo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {totalsByGroup
              .filter((t) => t.total > 0)
              .map((t) => (
                <div key={t.grupo} className="flex items-center justify-between text-sm">
                  <span>{CATEGORY_GROUP_LABELS[t.grupo]}</span>
                  <div className="flex items-center gap-2">
                    <span>{formatCurrency(t.total)}</span>
                    <Badge variant="secondary">
                      {rendaTotal > 0 ? formatPercent(t.total / rendaTotal) : '—'}
                    </Badge>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      <ExpenseCategoryDialog open={dialogOpen} onOpenChange={setDialogOpen} category={editing} />
    </div>
  )
}

function IncomeTab() {
  const { data: categories = [], isLoading } = useIncomeCategories()
  const deleteCategory = useDeleteIncomeCategory()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Tables<'income_categories'> | undefined>()

  const total = categories.reduce((sum, c) => sum + c.valor_mensal, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="size-4" />
          Nova receita
        </Button>
      </div>

      {isLoading && <LoadingState />}

      {!isLoading && categories.length === 0 && (
        <EmptyState message="Nenhuma receita cadastrada ainda. Adicione a primeira." />
      )}

      {categories.length > 0 && (
        <Card className="animate-fade-in-up">
          <CardContent className="flex flex-col gap-2 pt-6">
            {categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-muted/40"
              >
                <div>
                  <p className="font-medium">{c.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(c.valor_mensal)} · {c.recorrencia}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditing(c)
                      setDialogOpen(true)
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      deleteCategory.mutate(c.id, {
                        onError: () => toast.error('Não consegui excluir essa receita'),
                      })
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between border-t pt-3 text-sm font-medium">
              <span>Renda total cadastrada</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <IncomeCategoryDialog open={dialogOpen} onOpenChange={setDialogOpen} category={editing} />
    </div>
  )
}
