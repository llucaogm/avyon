import { AguaSection } from '@/modules/habitos/components/corpo/AguaSection'
import { PesoSection } from '@/modules/habitos/components/corpo/PesoSection'

export function CorpoTab() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <AguaSection />
      <PesoSection />
    </div>
  )
}
