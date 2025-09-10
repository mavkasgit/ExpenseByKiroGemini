'use client'

import { useState } from 'react'
import { Modal, Button, useToast, Input } from '@/components/ui'
import { applyPreset } from '@/lib/actions/presets';
import { deleteAllUserData } from '@/lib/actions/settings';
import { SelectiveDeleteModal } from './SelectiveDeleteModal';

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [isResetting, setIsResetting] = useState(false)
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const [isSelectiveDeleteModalOpen, setIsSelectiveDeleteModalOpen] = useState(false)
  const [confirmationText, setConfirmationText] = useState('')
  const toast = useToast()

  const refreshPage = () => {
    window.location.reload()
  }

  const handleResetToDefaults = async () => {
    if (!confirm('Вы уверены, что хотите сбросить все категории и группы к стандартным? Ваши пользовательские данные будут удалены.')) {
      return
    }
    setIsResetting(true)
    try {
      const result = await applyPreset('Базовый')
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Категории сброшены к стандартным')
        refreshPage()
      }
    } catch (error) {
      toast.error('Произошла ошибка при сбросе категорий')
    } finally {
      setIsResetting(false)
    }
  }

  const handleDeleteAllData = async () => {
    if (confirmationText.toLowerCase() !== 'удалить все данные') {
      toast.error('Текст подтверждения введен неверно.')
      return
    }
    setIsDeletingAll(true)
    try {
      const result = await deleteAllUserData()
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(result.message || 'Все данные удалены')
        refreshPage()
      }
    } catch (error) {
      toast.error('Произошла ошибка при полном удалении данных')
    } finally {
      setIsDeletingAll(false)
    }
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Настройки и опасная зона">
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-medium text-gray-900">Массовые операции</h4>
            <p className="text-sm text-gray-500 mt-1">
              Эти действия затрагивают данные вашего аккаунта. Используйте с осторожностью.
            </p>
          </div>

          <div className="p-4 border border-gray-300 bg-gray-50 rounded-lg">
            <h5 className="font-semibold text-gray-800">Выборочное удаление</h5>
            <p className="text-sm text-gray-700 mt-1 mb-3">
              Удалить только определенные типы данных (например, только расходы или только ключевые слова).
            </p>
            <Button 
              variant="outline" 
              onClick={() => setIsSelectiveDeleteModalOpen(true)}
            >
              Открыть выборочное удаление
            </Button>
          </div>

          <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-lg">
            <h5 className="font-semibold text-yellow-800">Сбросить к стандартным</h5>
            <p className="text-sm text-yellow-700 mt-1 mb-3">
              Это действие заменит все ваши текущие категории и группы на набор стандартных. Ваши пользовательские данные будут удалены.
            </p>
            <Button 
              variant="outline" 
              onClick={handleResetToDefaults}
              disabled={isResetting}
            >
              {isResetting ? 'Сброс...' : 'Сбросить к стандартным'}
            </Button>
          </div>

          <div className="p-4 border border-red-300 bg-red-50 rounded-lg">
            <h5 className="font-semibold text-red-800">Удалить абсолютно всё</h5>
            <p className="text-sm text-red-700 mt-1 mb-3">
              Это действие безвозвратно удалит ВСЕ ваши данные: расходы, категории, группы, ключевые слова.
            </p>
            <div className="space-y-2">
              <label className="text-xs text-gray-600">Для подтверждения, введите: <strong className="font-mono">УДАЛИТЬ ВСЕ ДАННЫЕ</strong></label>
              <Input 
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Текст подтверждения"
                variant="filled"
              />
              <Button 
                variant="danger" 
                onClick={handleDeleteAllData}
                disabled={isDeletingAll || confirmationText.toLowerCase() !== 'удалить все данные'}
                className="w-full"
              >
                {isDeletingAll ? 'Удаление...' : 'Я понимаю последствия, удалить всё'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
      <SelectiveDeleteModal 
        isOpen={isSelectiveDeleteModalOpen} 
        onClose={() => setIsSelectiveDeleteModalOpen(false)} 
      />
    </>
  )
}
