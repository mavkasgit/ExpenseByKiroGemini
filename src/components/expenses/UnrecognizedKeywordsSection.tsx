'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useToast } from '@/hooks/useToast'
import { getUnrecognizedKeywords, assignCategoryToKeyword, deleteUnrecognizedKeyword } from '@/lib/actions/keywords'
import type { Category, UnrecognizedKeyword } from '@/types'

interface UnrecognizedKeywordsSectionProps {
  categories: Category[]
  isVisible: boolean
  onToggleVisibility: () => void
}

export function UnrecognizedKeywordsSection({ 
  categories, 
  isVisible, 
  onToggleVisibility 
}: UnrecognizedKeywordsSectionProps) {
  const [keywords, setKeywords] = useState<UnrecognizedKeyword[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [assigningKeywords, setAssigningKeywords] = useState<Set<string>>(new Set())
  const { showToast } = useToast()

  // Форматируем категории для SearchableSelect
  const categoryOptions = categories.map(category => ({
    value: category.id,
    label: category.name,
    color: category.color || '#6366f1',
    icon: category.icon || 'shopping-bag'
  }))

  // Загружаем неопознанные ключевые слова
  useEffect(() => {
    if (isVisible) {
      loadUnrecognizedKeywords()
    }
  }, [isVisible]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadUnrecognizedKeywords = async () => {
    setIsLoading(true)
    try {
      const result = await getUnrecognizedKeywords()
      if (result.success) {
        setKeywords(result.data || [])
      } else {
        showToast(result.error || 'Ошибка загрузки неопознанных ключевых слов', 'error')
      }
    } catch (error) {
      showToast('Произошла ошибка при загрузке', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssignCategory = async (keyword: UnrecognizedKeyword, categoryId: string) => {
    setAssigningKeywords(prev => new Set(prev).add(keyword.id))
    
    try {
      const result = await assignCategoryToKeyword({
        keyword: keyword.keyword,
        category_id: categoryId
      })

      if (result.success) {
        showToast(`Ключевое слово "${keyword.keyword}" назначено категории`, 'success')
        // Удаляем из списка неопознанных
        setKeywords(prev => prev.filter(k => k.id !== keyword.id))
      } else {
        showToast(result.error || 'Ошибка назначения категории', 'error')
      }
    } catch (error) {
      showToast('Произошла ошибка при назначении категории', 'error')
    } finally {
      setAssigningKeywords(prev => {
        const newSet = new Set(prev)
        newSet.delete(keyword.id)
        return newSet
      })
    }
  }

  const handleDeleteKeyword = async (keyword: UnrecognizedKeyword) => {
    if (!confirm(`Удалить ключевое слово "${keyword.keyword}"?`)) {
      return
    }

    try {
      const result = await deleteUnrecognizedKeyword(keyword.id)
      if (result.success) {
        showToast('Ключевое слово удалено', 'success')
        setKeywords(prev => prev.filter(k => k.id !== keyword.id))
      } else {
        showToast(result.error || 'Ошибка удаления ключевого слова', 'error')
      }
    } catch (error) {
      showToast('Произошла ошибка при удалении', 'error')
    }
  }

  if (keywords.length === 0 && !isLoading) {
    return null // Не показываем секцию если нет неопознанных ключевых слов
  }

  return (
    <Card className="mb-6">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">
              🔤 Неопознанные ключевые слова
            </h3>
            <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
              {keywords.length}
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
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Назначьте категории этим ключевым словам для улучшения автоматической категоризации расходов.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {keywords.map((keyword) => (
                    <div
                      key={keyword.id}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="font-medium text-gray-900">
                            {keyword.keyword}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            Встречается: {keyword.frequency} раз
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteKeyword(keyword)}
                          className="text-gray-400 hover:text-red-600 p-1"
                          title="Удалить ключевое слово"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <SearchableSelect
                          options={categoryOptions}
                          value=""
                          onChange={(categoryId) => handleAssignCategory(keyword, categoryId)}
                          placeholder="Выберите категорию..."
                          disabled={assigningKeywords.has(keyword.id)}
                          size="sm"
                        />
                        
                        {assigningKeywords.has(keyword.id) && (
                          <div className="text-xs text-blue-600 text-center">
                            Назначение категории...
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Card>
  )
}