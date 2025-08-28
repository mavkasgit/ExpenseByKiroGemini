import { getExpenses } from '@/lib/actions/expenses'
import { getCategories } from '@/lib/actions/categories'
import { StickyPageHeaderWrapper } from '@/components/layout/StickyPageHeaderWrapper'
import { ExpensesPageContent } from '@/components/expenses/ExpensesPageContent'


export default async function ExpensesPage() {
  const limit = 100

  const [expensesResult, categoriesResult] = await Promise.all([
    getExpenses({ limit }),
    getCategories()
  ])

  const expenses = expensesResult.data || []
  const totalCount = expensesResult.count || 0
  const categories = categoriesResult.data || []

  return (
    <div className="min-h-screen bg-gray-50">
      <StickyPageHeaderWrapper 
        title="Расходы"
        description="Просмотр и управление вашими расходами"
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
            <ExpensesPageContent 
              initialExpenses={expenses}
              totalCount={totalCount}
              categories={categories}
              error={expensesResult.error}
            />
        </div>
      </div>
    </div>
  )
}