import { CitySynonymManager } from '@/components/settings/CitySynonymManager'
import { StickyPageHeaderWrapper } from '@/components/layout/StickyPageHeaderWrapper'

export default function CitiesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <StickyPageHeaderWrapper
        title="Города и синонимы"
        description="Управляйте городами и их синонимами для лучшей аналитики."
      />

      <div className="container mx-auto px-4 pt-4 pb-8">
        <CitySynonymManager />
      </div>
    </div>
  )
}
