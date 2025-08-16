'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { SimpleToast } from '@/components/ui/Toast'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { 
  createKeyword, 
  updateKeyword, 
  deleteKeyword, 
  getKeywords,
  getKeywordsByCategory 
} from '@/lib/actions/keywords'
import { formatDateLocaleRu } from '@/lib/utils/dateUtils'
import type { CategoryKeyword, Category } from '@/types'

interface KeywordManagerProps {
  categories: Category[]
  selectedCategoryId?: string
  onKeywordChange?: () => void
}

interface KeywordWithCategory extends CategoryKeyword {
  categories?: {
    id: string
    name: string
    color: string | null
    icon: string | null
  }
}

export function KeywordManager({ categories, selectedCategoryId, onKeywordChange }: KeywordManagerProps) {
  const [keywords, setKeywords] = useState<KeywordWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingKeyword, setEditingKeyword] = useState<KeywordWithCategory | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Форма для добавления/редактирования ключевого слова
  const [formData, setFormData] = useState({
    keyword: '',
    category_id: selectedCategoryId || ''
  })

  // Загрузка ключевых слов
  const loadKeywords = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let result
      if (selectedCategoryId) {
        result = await getKeywordsByCategory(selectedCategoryId)
      } else {
        result = await getKeywords()
      }

      if (result.error) {
        setError(result.error)
      } else {
        setKeywords(result.data || [])
      }
    } catch (err) {
      setError('Произошла ошибка при загрузке ключевых слов')
    } finally {
      setLoading(false)
    }
  }, [selectedCategoryId])

  useEffect(() => {
    loadKeywords()
  }, [loadKeywords])

  // Обработка добавления ключевого слова
  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.keyword.trim() || !formData.category_id) {
      setError('Заполните все обязательные поля')
      return
    }

    setLoading(true)
    const result = await createKeyword({
      keyword: formData.keyword.trim(),
      category_id: formData.category_id
    })

    if (result.error) {
      setError(result.error)
      setToast({ message: result.error, type: 'error' })
    } else {
      setToast({ message: 'Ключевое слово успешно добавлено', type: 'success' })
      setIsAddModalOpen(false)
      setFormData({ keyword: '', category_id: selectedCategoryId || '' })
      await loadKeywords()
      onKeywordChange?.()
    }
    setLoading(false)
  }

  // Обработка редактирования ключевого слова
  const handleEditKeyword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingKeyword || !formData.keyword.trim() || !formData.category_id) {
      setError('Заполните все обязательные поля')
      return
    }

    setLoading(true)
    const result = await updateKeyword(editingKeyword.id, {
      keyword: formData.keyword.trim(),
      category_id: formData.category_id
    })

    if (result.error) {
      setError(result.error)
      setToast({ message: result.error, type: 'error' })
    } else {
      setToast({ message: 'Ключевое слово успешно обновлено', type: 'success' })
      setIsEditModalOpen(false)
      setEditingKeyword(null)
      await loadKeywords()
      onKeywordChange?.()
    }
    setLoading(false)
  }

  // Обработка удаления ключевого слова
  const handleDeleteKeyword = async (keyword: KeywordWithCategory) => {
    if (!confirm(`Удалить ключевое слово &quot;${keyword.keyword}&quot;?`)) {
      return
    }

    setLoading(true)
    const result = await deleteKeyword(keyword.id)

    if (result.error) {
      setError(result.error)
      setToast({ message: result.error, type: 'error' })
    } else {
      setToast({ message: 'Ключевое слово успешно удалено', type: 'success' })
      await loadKeywords()
      onKeywordChange?.()
    }
    setLoading(false)
  }

  // Открытие модального окна редактирования
  const openEditModal = (keyword: KeywordWithCategory) => {
    setEditingKeyword(keyword)
    setFormData({
      keyword: keyword.keyword,
      category_id: keyword.category_id || ''
    })
    setIsEditModalOpen(true)
  }

  // Получение названия категории
  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Без категории'
    const category = categories.find(c => c.id === categoryId)
    return category?.name || 'Неизвестная категория'
  }

  // Получение цвета категории
  const getCategoryColor = (categoryId: string | null) => {
    if (!categoryId) return '#6b7280'
    const category = categories.find(c => c.id === categoryId)
    return category?.color || '#6b7280'
  }

  if (loading && keywords.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Загрузка ключевых слов...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопка добавления */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Ключевые слова
            {selectedCategoryId && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                для категории &quot;{getCategoryName(selectedCategoryId)}&quot;
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Управляйте ключевыми словами для автоматической категоризации расходов
          </p>
        </div>
        <Button
          onClick={() => {
            setFormData({ keyword: '', category_id: selectedCategoryId || '' })
            setIsAddModalOpen(true)
          }}
          disabled={loading}
        >
          Добавить ключевое слово
        </Button>
      </div>

      {/* Ошибка */}
      {error && (
        <ErrorMessage error={error} onDismiss={() => setError(null)} showDismiss />
      )}

      {/* Список ключевых слов */}
      {keywords.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-gray-500">
            {selectedCategoryId 
              ? 'У этой категории пока нет ключевых слов'
              : 'У вас пока нет ключевых слов'
            }
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Добавьте ключевые слова для автоматической категоризации расходов
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {keywords.map((keyword) => (
            <Card key={keyword.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {keyword.keyword}
                      </span>
                      <span 
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: getCategoryColor(keyword.category_id) }}
                      >
                        {getCategoryName(keyword.category_id)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                      <span>
                        Создано: {formatDateLocaleRu(keyword.created_at || '')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(keyword)}
                    disabled={loading}
                  >
                    Изменить
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteKeyword(keyword)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Удалить
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Модальное окно добавления ключевого слова */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Добавить ключевое слово"
      >
        <form onSubmit={handleAddKeyword} className="space-y-4">
          <div>
            <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-1">
              Ключевое слово *
            </label>
            <Input
              id="keyword"
              type="text"
              value={formData.keyword}
              onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
              placeholder="Введите ключевое слово"
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Категория *
            </label>
            <SearchableSelect
              options={categories.map(category => ({
                value: category.id,
                label: category.name,
                color: category.color || undefined
              }))}
              value={formData.category_id}
              onChange={(value) => setFormData({ ...formData, category_id: value })}
              placeholder="Выберите категорию"
              required
            />
          </div>



          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Добавление...' : 'Добавить'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Модальное окно редактирования ключевого слова */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Редактировать ключевое слово"
      >
        <form onSubmit={handleEditKeyword} className="space-y-4">
          <div>
            <label htmlFor="edit-keyword" className="block text-sm font-medium text-gray-700 mb-1">
              Ключевое слово *
            </label>
            <Input
              id="edit-keyword"
              type="text"
              value={formData.keyword}
              onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
              placeholder="Введите ключевое слово"
              required
            />
          </div>

          <div>
            <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700 mb-1">
              Категория *
            </label>
            <SearchableSelect
              options={categories.map(category => ({
                value: category.id,
                label: category.name,
                color: category.color || undefined
              }))}
              value={formData.category_id}
              onChange={(value) => setFormData({ ...formData, category_id: value })}
              placeholder="Выберите категорию"
              required
            />
          </div>



          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Toast уведомления */}
      {toast && (
        <SimpleToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}