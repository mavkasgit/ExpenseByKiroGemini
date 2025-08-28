
'use client'

import { useState, useEffect } from 'react'
import type { Category, UncategorizedExpenseWithKeywords } from '@/types'
import { getUncategorizedExpensesWithKeywords } from '@/lib/actions/expenses'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Button } from '@/components/ui/Button'
import { assignKeywordToCategory } from '@/lib/actions/keywords'
import { useToast } from '@/hooks/useToast'
import { SearchableSelect } from '@/components/ui/SearchableSelect'

interface UnrecognizedKeywordsProps {
  categories: Category[]
  onKeywordAssigned: () => void
}

export function UnrecognizedKeywords({ categories, onKeywordAssigned }: UnrecognizedKeywordsProps) {
  const [expenses, setExpenses] = useState<UncategorizedExpenseWithKeywords[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useToast()
  const [editingKeyword, setEditingKeyword] = useState<Record<string, string>>({})

  const loadUncategorizedExpenses = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getUncategorizedExpensesWithKeywords()
      if (result.error) {
        setError(result.error)
      } else {
        setExpenses(result.data || [])
        const initialKeywords: Record<string, string> = {}
        result.data?.forEach(exp => {
          exp.suggested_keywords?.forEach(kw => {
            initialKeywords[kw] = kw
          })
        })
        setEditingKeyword(initialKeywords)
      }
    } catch (err) {
      setError('Произошла ошибка при загрузке неопознанных расходов')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUncategorizedExpenses()
  }, [])

  const handleAssign = async (originalKeyword: string, categoryId: string) => {
    const keywordToAssign = editingKeyword[originalKeyword] || originalKeyword
    try {
      const result = await assignKeywordToCategory(keywordToAssign, categoryId)
      if (result.error) {
        showToast(result.error, 'error')
      } else {
        showToast('Ключевое слово успешно привязано!', 'success')
        onKeywordAssigned()
        loadUncategorizedExpenses() // Refresh the list
      }
    } catch (err) {
      showToast('Произошла ошибка при привязке ключевого слова', 'error')
    }
  }

  if (loading) {
    return <div className="text-center p-4">Загрузка...</div>
  }

  if (error) {
    return <ErrorMessage error={error} />
  }

  const allSuggestedKeywords = expenses.flatMap(e => e.suggested_keywords || [])
  const uniqueKeywords = [...new Set(allSuggestedKeywords)]

  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name, color: c.color }))

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Неопознанные ключевые слова</h3>
      <p className="text-sm text-gray-500">
        Здесь показаны слова из описаний расходов, которые не были автоматически отнесены к какой-либо категории. Вы можете привязать их к существующим категориям.
      </p>
      {uniqueKeywords.length === 0 ? (
        <p className="text-gray-500">Неопознанных ключевых слов не найдено.</p>
      ) : (
        <ul className="space-y-2">
          {uniqueKeywords.map(keyword => (
            <li key={keyword} className="p-3 bg-gray-50 rounded-md flex items-center justify-between gap-4">
              <input
                type="text"
                value={editingKeyword[keyword] || keyword}
                onChange={(e) => setEditingKeyword(prev => ({ ...prev, [keyword]: e.target.value }))}
                className="flex-grow p-2 border border-gray-300 rounded-md"
              />
              <div className="w-64">
                <SearchableSelect
                  options={categoryOptions}
                  value={null}
                  onChange={(categoryId) => handleAssign(keyword, categoryId)}
                  placeholder="Выберите категорию..."
                  size="sm"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      <Button onClick={loadUncategorizedExpenses} variant="outline">Обновить</Button>
    </div>
  )
}
