import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { HojeTab } from '@/modules/habitos/components/hoje/HojeTab'
import { MapaTab } from '@/modules/habitos/components/mapa/MapaTab'
import { CorpoTab } from '@/modules/habitos/components/corpo/CorpoTab'

export default function HabitosPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Hábitos</h1>
      </div>

      <Tabs defaultValue="hoje">
        <TabsList>
          <TabsTrigger value="hoje">Hoje</TabsTrigger>
          <TabsTrigger value="mapa">Mapa</TabsTrigger>
          <TabsTrigger value="corpo">Corpo</TabsTrigger>
        </TabsList>
        <TabsContent value="hoje" className="mt-4">
          <HojeTab />
        </TabsContent>
        <TabsContent value="mapa" className="mt-4">
          <MapaTab />
        </TabsContent>
        <TabsContent value="corpo" className="mt-4">
          <CorpoTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
