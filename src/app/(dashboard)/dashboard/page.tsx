import { createServerClient } from '@/lib/supabase/server'
import { StickyPageHeaderWrapper } from '@/components/layout/StickyPageHeaderWrapper'
import { getExpenseStats } from '@/lib/actions/expenses'
import { QuickExpenseForm } from '@/components/expense-input/QuickExpenseForm'
import { Card } from '@/components/ui/Card'
import { formatAmount } from '@/lib/utils/formatNumber'
import Link from 'next/link'

export default async function MainPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Загружаем статистику
  const statsResult = await getExpenseStats()
  const stats = statsResult.data

  return (
    <div className="min-h-screen bg-gray-50">
      <StickyPageHeaderWrapper
        title="Expense Tracker"
        description="Управление личными расходами"
      />
      
      <div className="container mx-auto px-4 py-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Быстрый ввод расхода */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Быстрый ввод
            </h2>
            <QuickExpenseForm />
          </div>

          {/* Статистика */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Статистика
            </h2>
            {stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatAmount(stats.totalAmount)}
                  </div>
                  <div className="text-sm text-gray-600">Всего потрачено</div>
                </Card>
                
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.totalCount}
                  </div>
                  <div className="text-sm text-gray-600">Всего расходов</div>
                </Card>
                
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.categorizedCount}
                  </div>
                  <div className="text-sm text-gray-600">Категоризировано</div>
                </Card>
                
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.uncategorizedCount}
                  </div>
                  <div className="text-sm text-gray-600">Без категории</div>
                </Card>
              </div>
            ) : (
              <Card className="p-6 text-center">
                <p className="text-gray-600">Нет данных для отображения</p>
              </Card>
            )}
          </div>
        </div>
        
        {/* Основные разделы */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            href="/expenses"
            className="group bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all duration-300 cursor-pointer hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-100 hover:scale-105"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-green-200 transition-colors">
                <span className="text-2xl">💰</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 group-hover:text-green-800 transition-colors">Расходы</h2>
            </div>
            <p className="text-gray-600 group-hover:text-green-700 transition-colors">Просмотр и управление расходами</p>
          </Link>
          
          
          
          <Link
            href="/expenses/bulk"
            className="group bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all duration-300 cursor-pointer hover:bg-gradient-to-br hover:from-orange-50 hover:to-orange-100 hover:scale-105"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-orange-200 transition-colors">
                <span className="text-2xl">📦</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 group-hover:text-orange-800 transition-colors">Массовый ввод</h2>
            </div>
            <p className="text-gray-600 group-hover:text-orange-700 transition-colors">Загрузка расходов из файла</p>
          </Link>
          
          <Link
            href="/categories"
            className="group bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all duration-300 cursor-pointer hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-100 hover:scale-105"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-indigo-200 transition-colors">
                <span className="text-2xl">📂</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-800 transition-colors">Категории</h2>
            </div>
            <p className="text-gray-600 group-hover:text-indigo-700 transition-colors">Настройка категорий расходов</p>
          </Link>
        </div>

        {/* Дополнительные инструменты */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Инструменты разработчика
          </h3>
          <div className="space-y-3">
            <a
              href="/ui-demo"
              className="block p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-xl mr-3">🎨</span>
                <div>
                  <div className="font-medium text-gray-900">Демо UI компонентов</div>
                  <div className="text-sm text-gray-600">Просмотр всех компонентов интерфейса</div>
                </div>
              </div>
            </a>
            <a
              href="/debug-auth"
              className="block p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-xl mr-3">🔧</span>
                <div>
                  <div className="font-medium text-gray-900">Отладка аутентификации</div>
                  <div className="text-sm text-gray-600">Информация о текущей сессии</div>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}