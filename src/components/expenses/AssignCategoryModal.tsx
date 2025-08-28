'use client'

import { useState, useEffect, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { CategoryForm } from '@/components/categories/CategoryForm'
import { useToast } from '@/hooks/useToast'
import { assignCategoryToKeyword } from '@/lib/actions/keywords'
import type { UncategorizedExpenseWithKeywords, Category } from '@/types'
import { iconMap } from '@/components/categories/CategoryCard'

interface AssignCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  expense: UncategorizedExpenseWithKeywords
  categories: Category[]
}

export function AssignCategoryModal({
  isOpen,
  onClose,
  onSuccess,
  expense,
  categories: initialCategories,
}: AssignCategoryModalProps) {
  const [selectedKeyword, setSelectedKeyword] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [localCategories, setLocalCategories] = useState(initialCategories)
  const [selection, setSelection] = useState<string | null>(null)
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null)
  const descriptionRef = useRef<HTMLParagraphElement>(null)

  const { showToast } = useToast()

  useEffect(() => {
    // Reset state when a new expense is passed in or modal closes
    setSelectedKeyword('')
    setSelectedCategoryId('')
    setSelection(null)
    setPopupPosition(null)
    setLocalCategories(initialCategories)
  }, [expense, initialCategories, isOpen])

  const handleClick = (e: React.MouseEvent<HTMLParagraphElement>) => {
    const selection = window.getSelection()
    if (!selection) return

    let selectedText = selection.toString().trim()
    const description = expense.description || ''

    // This logic handles both drag-to-select and click-to-select
    if (selectedText.length === 0) {
      // If nothing is selected, it's a click. Let's select a word.
      const words = description.split(' ').filter(w => w.length > 0)
      const pElement = descriptionRef.current
      if (!pElement) return

      if (words.length > 0 && words.length <= 2) {
        // If 1 or 2 words, select the whole description
        const range = document.createRange()
        range.selectNodeContents(pElement)
        selection.removeAllRanges()
        selection.addRange(range)
      } else {
        // Otherwise, select the word at the click position
        const range = document.caretRangeFromPoint(e.clientX, e.clientY)
        if (range) {
          selection.removeAllRanges()
          selection.addRange(range)
          selection.modify('move', 'backward', 'word')
          selection.modify('extend', 'forward', 'word')
        }
      }
      selectedText = selection.toString().trim()
    }

    // Now, with text selected (either by drag or by click), show the popup.
    if (selectedText) {
      try {
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        if (descriptionRef.current) {
          const containerRect = descriptionRef.current.getBoundingClientRect()
          setPopupPosition({
            top: rect.bottom - containerRect.top + window.scrollY,
            left: rect.left - containerRect.left + window.scrollX + rect.width / 2,
          })
        }
        setSelection(selectedText)
      } catch (error) {
        // This can happen if the selection is empty or invalid.
        setSelection(null)
        setPopupPosition(null)
      }
    } else {
      setSelection(null)
      setPopupPosition(null)
    }
  }

  const handleCreateKeyword = () => {
    if (selection) {
      setSelectedKeyword(selection)
      setSelection(null)
      setPopupPosition(null)
    }
  }

  const handleAssign = async () => {
    if (!selectedKeyword || !selectedCategoryId) {
      showToast('Пожалуйста, создайте ключевое слово и выберите категорию', 'error')
      return
    }

    setIsLoading(true)
    try {
      const result = await assignCategoryToKeyword({
        keyword: selectedKeyword,
        category_id: selectedCategoryId,
      })

      if (result.success) {
        const count = result.recategorizedCount || 0
        showToast(`Категория назначена. Обновлено расходов: ${count}`, 'success')
        onSuccess()
      } else {
        showToast(result.error || 'Произошла ошибка', 'error')
      }
    } catch (error) {
      showToast('Произошла непредвиденная ошибка', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCategorySuccess = (newCategory: Category) => {
    if (newCategory) {
      setLocalCategories(prev => [newCategory, ...prev])
      setSelectedCategoryId(newCategory.id)
    }
    setIsCreateCategoryModalOpen(false)
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Назначить категорию"
        description="Выделите часть текста из описания, чтобы создать ключевое слово."
      >
        <div className="space-y-6">
          {/* Шаг 1: Выбор ключевого слова */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              1. Создайте ключевое слово
            </label>
            <div className="relative" ref={descriptionRef}>
              <p
                className="p-4 border rounded-md bg-gray-50 select-text"
                onClick={handleClick}
              >
                {expense.description || ''}
              </p>
              {selection && popupPosition && (
                <div
                  className="absolute z-10"
                  style={{
                    top: `${popupPosition.top}px`,
                    left: `${popupPosition.left}px`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <Button size="sm" onClick={handleCreateKeyword}>
                    Создать слово: &quot;{selection}&quot;
                  </Button>
                </div>
              )}
              {selectedKeyword && (
                <div className="mt-3 text-center">
                  <span className="text-sm font-medium text-gray-700">
                    Ключевое слово:
                  </span>
                  <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                    {selectedKeyword}
                    <button
                      onClick={() => setSelectedKeyword('')}
                      className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                    >
                      &times;
                    </button>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Шаг 2: Выбор категории */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              2. Выберите категорию
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-grow">
                <SearchableSelect
                  options={localCategories.map(c => ({
                    value: c.id,
                    label: c.name,
                    color: c.color || undefined,
                    emoji: iconMap[c.icon || 'other'] || '📦',
                  }))}
                  value={selectedCategoryId}
                  onChange={setSelectedCategoryId}
                  placeholder="Выберите категорию..."
                  disabled={!selectedKeyword}
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setIsCreateCategoryModalOpen(true)}
                disabled={!selectedKeyword}
              >
                Создать
              </Button>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="ghost" onClick={onClose} disabled={isLoading}>
              Отмена
            </Button>
            <Button
              onClick={handleAssign}
              isLoading={isLoading}
              disabled={!selectedKeyword || !selectedCategoryId}
            >
              Назначить
            </Button>
          </div>
        </div>
      </Modal>

      {/* Модальное окно создания категории */}
      {isCreateCategoryModalOpen && (
        <Modal
          isOpen={isCreateCategoryModalOpen}
          onClose={() => setIsCreateCategoryModalOpen(false)}
          title="Создать новую категорию"
        >
          <CategoryForm
            onSuccess={handleCreateCategorySuccess}
            onCancel={() => setIsCreateCategoryModalOpen(false)}
          />
        </Modal>
      )}
    </>
  )
}
