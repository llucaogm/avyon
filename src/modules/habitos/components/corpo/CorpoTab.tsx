import { AguaSection } from '@/modules/habitos/components/corpo/AguaSection'
import { PesoSection } from '@/modules/habitos/components/corpo/PesoSection'

export function CorpoTab() {
  return (
    <div className="flex flex-col gap-4">
      <AguaSection />
      <PesoSection />
    </div>
  )
}
