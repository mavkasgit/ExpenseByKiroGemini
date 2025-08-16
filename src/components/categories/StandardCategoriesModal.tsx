'use client'

import { useState } from 'react'
import { Modal, Button, useToast } from '@/components/ui'
import { createDefaultCategories } from '@/lib/actions/categories'

interface StandardCategoriesModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function StandardCategoriesModal({ isOpen, onClose, onSuccess }: StandardCategoriesModalProps) {
  const [isCreating, setIsCreating] = useState(false)
  const toast = useToast()

  const handleCreate = async () => {
    setIsCreating(true)

    try {
      const result = await createDefaultCategories()
      
      if ('error' in result) {
        toast.error(result.error || 'Произошла ошибка')
      } else {
        toast.success(result.message || 'Стандартные категории и группы созданы')
        onSuccess()
        onClose()
      }
    } catch (error) {
      toast.error('Произошла ошибка при создании стандартных категорий')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Создать стандартные категории и группы"
      description="Будут созданы все стандартные категории и группы для организации ваших расходов"
      size="md"
    >
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start">
            <div className="text-blue-600 mr-3 mt-0.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Что будет создано:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 8 групп категорий (Основные, Транспорт, Еда и напитки, и др.)</li>
                <li>• Более 30 готовых категорий с иконками и цветами</li>
                <li>• Автоматическая организация по группам</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button variant="ghost" onClick={onClose} disabled={isCreating}>
            Отмена
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreate}
            disabled={isCreating}
          >
            {isCreating ? 'Создание...' : 'Создать стандартные'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}