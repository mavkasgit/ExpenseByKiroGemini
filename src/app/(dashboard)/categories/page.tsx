import { createServerClient } from '@/lib/supabase/server'
import { CategoriesManager } from '@/components/categories/CategoriesManager'
import { StickyPageHeaderWrapper } from '@/components/layout/StickyPageHeaderWrapper'

export default async function CategoriesPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Параллельно получаем категории и группы для оптимизации
  const [categoriesResult, groupsResult] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('category_groups')
      .select('*')
      .eq('user_id', user?.id)
      .order('sort_order', { ascending: true })
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <StickyPageHeaderWrapper
        title="Управление категориями"
        description="Создавайте и настраивайте категории для организации ваших расходов"
      />

      <div className="container mx-auto px-4 pt-4 pb-8">
        <CategoriesManager 
          initialCategories={categoriesResult.data || []}
          initialGroups={groupsResult.data || []}
        />
      </div>
    </div>
  )
}