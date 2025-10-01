'use client'

import dynamic from 'next/dynamic'
import type { Category, CategoryGroup, CategoryKeywordWithSynonyms } from '@/types'
import type { UserSettings } from '@/lib/actions/settings'

// Define the props interface
interface CategoriesPageClientProps {
  initialGroups: CategoryGroup[];
  initialCategories: Category[];
  initialKeywords: CategoryKeywordWithSynonyms[];
  initialSettings: UserSettings;
}

// Dynamic import of the manager
const CategoriesManager = dynamic(
  () => import('@/components/categories/CategoriesManager').then(mod => mod.CategoriesManager),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-96 flex justify-center items-center">
        <p>Загрузка менеджера категорий...</p>
      </div>
    )
  }
)

export function CategoriesPageClient(props: CategoriesPageClientProps) {
  return <CategoriesManager {...props} />
}
