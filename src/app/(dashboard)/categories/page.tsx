import { redirect } from 'next/navigation'

import { createServerClient } from '@/lib/supabase/server'
import { StickyPageHeaderWrapper } from '@/components/layout/StickyPageHeaderWrapper'
import { getAllKeywords } from '@/lib/actions/keywords'
import { getUserSettings } from '@/lib/actions/settings'
import { CategoriesPageClient } from './CategoriesPageClient'
import { normalizeKeywords } from '@/lib/utils'

export default async function CategoriesPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.id) {
    redirect('/login')
  }

  const userId = user.id

  // Параллельно получаем все необходимые данные
  const [categoriesResult, groupsResult, keywordsResult, settingsResult] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true, nullsFirst: false }),
    supabase
      .from('category_groups')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true }),
    getAllKeywords(),
    getUserSettings(),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <StickyPageHeaderWrapper
        title="Управление категориями"
        description="Создавайте и настраивайте категории для организации ваших расходов"
      />

      <div className="container mx-auto px-4 pt-4 pb-8">
        <CategoriesPageClient
          initialCategories={categoriesResult.data || []}
          initialGroups={groupsResult.data || []}
          initialKeywords={normalizeKeywords(keywordsResult.data || [])}
          initialSettings={settingsResult.settings || {}}
        />
      </div>
    </div>
  )
}
