'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { getUncategorizedExpensesWithKeywords } from '@/lib/actions/expenses'
import { AssignCategoryModal } from './AssignCategoryModal'
import type { Category, UncategorizedExpenseWithKeywords } from '@/types'
import { formatAmount } from '@/lib/utils/formatNumber'
import { formatDateLocaleRu } from '@/lib/utils/dateUtils'

interface UncategorizedSectionProps {
  categories: Category[]
  isVisible: boolean
  onToggleVisibility: () => void
  onExpensesCategorized: () => void // Callback to refresh parent component
}

export function UncategorizedSection({ 
  categories, 
  isVisible, 
  onToggleVisibility,
  onExpensesCategorized
}: UncategorizedSectionProps) {
  const [expenses, setExpenses] = useState<UncategorizedExpenseWithKeywords[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<UncategorizedExpenseWithKeywords | null>(null)
  const { showToast } = useToast()

  const loadUncategorizedExpenses = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getUncategorizedExpensesWithKeywords()
      if (result.success) {
        setExpenses(result.data || [])
      } else {
        showToast(result.error || 'Ошибка загрузки неопознанных расходов', 'error')
      }
    } catch (error) {
      showToast('Произошла ошибка при загрузке', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    if (isVisible) {
      loadUncategorizedExpenses()
    }
  }, [isVisible, loadUncategorizedExpenses])

  const handleCategorizationSuccess = () => {
    loadUncategorizedExpenses() // Refresh the list of uncategorized expenses
    onExpensesCategorized() // Refresh the main expenses list on the parent page
    setSelectedExpense(null) // Close the modal
  }

  if (expenses.length === 0 && !isLoading) {
    return null // Do not show the section if there are no uncategorized expenses
  }

  return (
    <>
      <Card className="mb-6">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">
                🔍 Неопознанные расходы
              </h3>
              <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                {expenses.length}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleVisibility}
            >
              {isVisible ? 'Скрыть' : 'Показать'}
            </Button>
          </div>

          {isVisible && (
            <>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Загрузка...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Найдены расходы без категории. Назначьте категорию ключевому слову из описания, чтобы автоматически обработать похожие траты.
                  </p>
                  {expenses.map((expense) => (
                    <Card key={expense.id} className="p-3 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-800 truncate">{expense.description}</div>
                          <div className="text-sm text-gray-500">
                            <span className="font-semibold">{formatAmount(expense.amount)}</span> - {formatDateLocaleRu(expense.expense_date)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <Button 
                            size="sm"
                            onClick={() => setSelectedExpense(expense)}
                          >
                            Назначить категорию
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {selectedExpense && (
        <AssignCategoryModal
          expense={selectedExpense}
          categories={categories}
          isOpen={!!selectedExpense}
          onClose={() => setSelectedExpense(null)}
          onSuccess={handleCategorizationSuccess}
        />
      )}
    </>
  )
}