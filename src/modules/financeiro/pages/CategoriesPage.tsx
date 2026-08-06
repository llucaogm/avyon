import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { MonthSwitcher } from '@/modules/financeiro/components/layout/MonthSwitcher'
import { CategoriaBreakdownSection } from '@/modules/financeiro/components/categorias/CategoriaBreakdownSection'
import { useMonth } from '@/modules/financeiro/context/MonthProvider'

export default function CategoriesPage() {
  const { selectedMonth } = useMonth()

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Categorias</h1>
        <p className="text-sm text-muted-foreground">
          Pra onde seu dinheiro foi — cada lançamento categorizado, independente de ser fixo ou avulso.
        </p>
        <MonthSwitcher />
      </div>

      <Tabs defaultValue="despesas">
        <TabsList>
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
          <TabsTrigger value="receitas">Receitas</TabsTrigger>
        </TabsList>
        <TabsContent value="despesas" className="mt-4">
          <CategoriaBreakdownSection tipo="despesa" monthDate={selectedMonth} />
        </TabsContent>
        <TabsContent value="receitas" className="mt-4">
          <CategoriaBreakdownSection tipo="receita" monthDate={selectedMonth} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
