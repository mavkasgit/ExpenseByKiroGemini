import { Suspense } from 'react'
import { StickyPageHeaderWrapper } from '@/components/layout/StickyPageHeaderWrapper'
import { QuickExpenseForm } from '@/components/expense-input/QuickExpenseForm'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'

async function AddExpensePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <StickyPageHeaderWrapper 
        title="Добавить расход"
        description="Система автоматически определит категорию по описанию"
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Быстрый ввод - слева */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Быстрый ввод расхода
            </h2>
            <QuickExpenseForm />
          </div>

          {/* Другие способы ввода - справа */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Другие способы ввода
            </h2>
            <div className="space-y-4">
              <Link href="/expenses/bulk">
                <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-blue-200">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">📊</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">
                        Массовый ввод
                      </h3>
                      <p className="text-sm text-gray-600">
                        Добавьте несколько расходов одновременно через таблицу
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
              
              <Link href="/keywords">
                <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-purple-200">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">🔤</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">
                        Управление ключевыми словами
                      </h3>
                      <p className="text-sm text-gray-600">
                        Настройте автоматическую категоризацию расходов
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </div>
        </div>

        {/* Информация о неопознанных расходах */}
        <div className="mt-8">
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              💡 Как работает автоматическая категоризация?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div className="space-y-2">
                <p>• Система анализирует описание расхода</p>
                <p>• Ищет совпадения с ключевыми словами</p>
              </div>
              <div className="space-y-2">
                <p>• Если найдено - присваивает категорию</p>
                <p>• Если не найдено - помещает в &quot;неопознанные&quot;</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-blue-200">
              <p className="text-sm text-blue-700">
                В разделе <Link href="/keywords" className="underline font-medium hover:text-blue-900">Ключевые слова</Link> вы можете настроить автоматическую категоризацию и назначить категории неопознанным расходам.
              </p>
            </div>
          </Card>
        </div>
        </div>
      </div>
    </div>
  )
}

export default function AddExpensePageWithSuspense() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    }>
      <AddExpensePage />
    </Suspense>
  )
}