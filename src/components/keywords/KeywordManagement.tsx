'use client'

import { useState, useEffect } from 'react'
import { KeywordManager } from './KeywordManager'
import { UnrecognizedKeywords } from './UnrecognizedKeywords'
import { getCategories } from '@/lib/actions/categories'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import type { Category } from '@/types'

interface KeywordManagementProps {
  selectedCategoryId?: string
}

export function KeywordManagement({ selectedCategoryId }: KeywordManagementProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'keywords' | 'unrecognized'>('keywords')

  // Загрузка категорий
  const loadCategories = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getCategories()

      if (result.error) {
        setError(result.error)
      } else {
        setCategories(result.data || [])
      }
    } catch (err) {
      setError('Произошла ошибка при загрузке категорий')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  // Обработка изменений в ключевых словах
  const handleKeywordChange = () => {
    // Можно добавить дополнительную логику при изменении ключевых слов
  }

  // Обработка назначения категории неопознанному ключевому слову
  const handleKeywordAssigned = () => {
    // Можно добавить дополнительную логику при назначении категории
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage error={error} onDismiss={() => setError(null)} showDismiss />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Вкладки */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('keywords')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'keywords'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Ключевые слова
          </button>
          <button
            onClick={() => setActiveTab('unrecognized')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'unrecognized'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Неопознанные слова
          </button>
        </nav>
      </div>

      {/* Содержимое вкладок */}
      <div>
        {activeTab === 'keywords' && (
          <KeywordManager
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onKeywordChange={handleKeywordChange}
          />
        )}
        {activeTab === 'unrecognized' && (
          <UnrecognizedKeywords
            categories={categories}
            onKeywordAssigned={handleKeywordAssigned}
          />
        )}
      </div>
    </div>
  )
}