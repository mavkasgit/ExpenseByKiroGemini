'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button, useToast } from '@/components/ui'
import { deleteCategory } from '@/lib/actions/categories'
import type { Category } from '@/types'

interface CategoryCardProps {
  category: Category
  onEdit: (category: Category) => void
  onDelete: (categoryId: string) => void
  onKeywords: (category: Category) => void
  isDraggable?: boolean
}

export const iconMap: Record<string, string> = {
  'shopping-bag': '🛍️',
  'car': '🚗',
  'home': '🏠',
  'food': '🍽️',
  'health': '🏥',
  'entertainment': '🎬',
  'education': '📚',
  'travel': '✈️',
  'sport': '⚽',
  'clothes': '👕',
  'bills': '📄',
  'other': '📦'
}

export function CategoryCard({ category, onEdit, onDelete, onKeywords, isDraggable = false }: CategoryCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const toast = useToast()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: category.id,
    disabled: !isDraggable,
    data: {
      type: 'category',
      category
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить эту категорию?')) {
      return
    }

    // Запускаем анимацию исчезновения
    setIsRemoving(true)
    
    // Небольшая задержка для анимации, затем удаляем из списка
    setTimeout(() => {
      onDelete(category.id)
    }, 300)
    
    setIsDeleting(true)
    
    try {
      const result = await deleteCategory(category.id)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Категория успешно удалена')
      }
    } catch (error) {
      toast.error('Произошла ошибка при удалении')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div 
      className={`rounded-lg p-3 hover:shadow-md transition-all duration-300 ${
        isRemoving ? 'opacity-0 scale-95 transform' : 'opacity-100 scale-100'
      }`}
      style={{ backgroundColor: category.color + '15' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="text-lg">
            <span>{iconMap[category.icon || 'other'] || '📦'}</span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 text-sm">{category.name}</h3>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(category)}
            className="text-gray-600 hover:text-indigo-600 p-1"
            title="Редактировать категорию"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onKeywords(category)}
            className="text-gray-600 hover:text-blue-600 p-1"
            title="Ключевые слова"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            isLoading={isDeleting}
            className="text-gray-600 hover:text-red-600 p-1"
            title="Удалить категорию"
          >
            {isDeleting ? (
              <div className="w-3 h-3" />
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}