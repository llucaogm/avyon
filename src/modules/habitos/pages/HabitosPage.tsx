import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { GradeTab } from '@/modules/habitos/components/grade/GradeTab'
import { CorpoTab } from '@/modules/habitos/components/corpo/CorpoTab'

export default function HabitosPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Hábitos</h1>
      </div>

      <Tabs defaultValue="grade">
        <TabsList>
          <TabsTrigger value="grade">Grade</TabsTrigger>
          <TabsTrigger value="corpo">Corpo</TabsTrigger>
        </TabsList>
        <TabsContent value="grade" className="mt-4">
          <GradeTab />
        </TabsContent>
        <TabsContent value="corpo" className="mt-4">
          <CorpoTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
