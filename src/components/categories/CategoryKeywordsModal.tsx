'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/hooks/useToast'
import { createKeyword, deleteKeyword } from '@/lib/actions/keywords'
import type { Category, CategoryKeyword } from '@/types'

interface CategoryKeywordsModalProps {
  isOpen: boolean
  onClose: () => void
  category: Category
  keywords: CategoryKeyword[]
  onKeywordChange: () => void
}

export function CategoryKeywordsModal({ isOpen, onClose, category, keywords, onKeywordChange }: CategoryKeywordsModalProps) {
  const [newKeyword, setNewKeyword] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const { showToast } = useToast()

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) {
      showToast('Введите ключевое слово', 'error')
      return
    }

    setIsAdding(true)
    try {
      const result = await createKeyword({
        keyword: newKeyword.trim().toLowerCase(),
        category_id: category.id
      })

      if (result.success) {
        showToast('Ключевое слово добавлено', 'success')
        setNewKeyword('')
        onKeywordChange()
      } else {
        showToast(result.error || 'Ошибка добавления ключевого слова', 'error')
      }
    } catch (error) {
      showToast('Произошла ошибка при добавлении', 'error')
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteKeyword = async (keywordId: string) => {
    try {
      const result = await deleteKeyword(keywordId)
      if (result.success) {
        showToast('Ключевое слово удалено', 'success')
        onKeywordChange()
      } else {
        showToast(result.error || 'Ошибка удаления ключевого слова', 'error')
      }
    } catch (error) {
      showToast('Произошла ошибка при удалении', 'error')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isAdding) {
      handleAddKeyword()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Ключевые слова: ${category.name}`}>
      <div className="space-y-4">
        {/* Добавление нового ключевого слова */}
        <div className="flex gap-2">
          <Input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Добавить ключевое слово..."
            disabled={isAdding}
            className="flex-1"
          />
          <Button
            onClick={handleAddKeyword}
            disabled={isAdding || !newKeyword.trim()}
            size="sm"
          >
            {isAdding ? 'Добавление...' : 'Добавить'}
          </Button>
        </div>

        {/* Список ключевых слов */}
        <div className="max-h-60 overflow-y-auto">
          {keywords.length === 0 ? (
            <Card className="p-4 text-center">
              <p className="text-gray-600 text-sm">
                Нет ключевых слов для этой категории
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Добавьте ключевые слова для автоматической категоризации расходов
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {keywords.map((keyword) => (
                <div
                  key={keyword.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900">
                      {keyword.keyword}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteKeyword(keyword.id)}
                    className="text-gray-500 hover:text-red-600 p-1"
                    title="Удалить ключевое слово"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Подсказка */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            💡 <strong>Совет:</strong> Добавляйте слова и фразы, которые часто встречаются в описаниях расходов этой категории. 
            Например, для категории &quot;Продукты&quot;: магазин, супермаркет, продукты, еда.
          </p>
        </div>

        {/* Кнопки */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </div>
    </Modal>
  )
}
