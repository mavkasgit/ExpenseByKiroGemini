import { CityInteractiveMap } from '@/components/cities/CityInteractiveMap'
import { StickyPageHeaderWrapper } from '@/components/layout/StickyPageHeaderWrapper'
import { CitySynonymManager } from '@/components/settings/CitySynonymManager'

export default function CitiesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <StickyPageHeaderWrapper
        title="Города и синонимы"
        description="Добавляйте новые города, связывайте разные написания и поддерживайте единый справочник."
      />

      <main className="container mx-auto space-y-10 px-4 pb-12 pt-6">
        <CityInteractiveMap />
        <CitySynonymManager />
      </main>
    </div>
  )
}
