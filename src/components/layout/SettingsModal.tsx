'use client'

import { useState, useEffect } from 'react'
import { Modal, Button, useToast, Input, Switch } from '@/components/ui'
import { deleteAllUserData, getUserSettings, updateUserSettings, UserSettings } from '@/lib/actions/settings';
import { SelectiveDeleteModal } from './SelectiveDeleteModal';

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const [isSelectiveDeleteModalOpen, setIsSelectiveDeleteModalOpen] = useState(false)
  const [confirmationText, setConfirmationText] = useState('')
  const [settings, setSettings] = useState<UserSettings>({})
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const toast = useToast()

  useEffect(() => {
    if (isOpen) {
      setIsLoadingSettings(true)
      getUserSettings()
        .then(result => {
          if (result.error) {
            toast.error(result.error);
          } else if (result.settings) {
            setSettings(result.settings);
          }
        })
        .catch(err => {
          toast.error("Не удалось загрузить настройки.");
        })
        .finally(() => {
          setIsLoadingSettings(false);
        });
    }
  }, [isOpen, toast])

  const handleSettingsChange = async (changedSettings: Partial<UserSettings>) => {
    setIsUpdatingSettings(true);
    const oldSettings = { ...settings };
    const newSettings = { ...settings, ...changedSettings };
    setSettings(newSettings); // Optimistic update

    try {
      const result = await updateUserSettings(changedSettings);
      if (result.error) {
        toast.error(result.error);
        setSettings(oldSettings); // Revert on error
      } else {
        toast.success('Настройки обновлены');
        if (changedSettings.hasOwnProperty('enable_bilingual_keywords')) {
          // Full page reload to ensure the new setting is applied everywhere
          window.location.reload();
        }
      }
    } catch (error) {
        toast.error('Произошла ошибка при обновлении настроек.');
        setSettings(oldSettings); // Revert on error
    } finally {
        setIsUpdatingSettings(false);
    }
  };

  const refreshPage = () => {
    window.location.reload()
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
      <Modal isOpen={isOpen} onClose={onClose} title="Настройки">
        <div className="space-y-8">

          {/* General Settings */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Общие настройки</h4>
            <div className="p-4 border border-gray-200 bg-white rounded-lg">
              <label htmlFor="bilingual-switch" className="font-semibold text-gray-800">Двуязычные ключевые слова</label>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                Включить управление латинской и кириллической версиями ключевых слов.
              </p>
              <Button
                onClick={() => handleSettingsChange({ enable_bilingual_keywords: !settings.enable_bilingual_keywords })}
                disabled={isLoadingSettings || isUpdatingSettings}
                isLoading={isUpdatingSettings}
                variant={settings.enable_bilingual_keywords ? 'success-dark' : 'success'}
                className="w-32"
              >
                {settings.enable_bilingual_keywords ? 'Выключить' : 'Включить'}
              </Button>
            </div>
            <div className="p-4 border border-gray-200 bg-white rounded-lg">
              <div>
                <label htmlFor="bilingual-cities-switch" className="font-semibold text-gray-800">Двуязычные города</label>
                <p className="text-sm text-gray-500 mt-1 mb-4">
                  Включить управление латинской и кириллической версиями городов.
                </p>
              </div>
              <Button
                onClick={() => handleSettingsChange({ enable_bilingual_cities: !settings.enable_bilingual_cities })}
                disabled={isLoadingSettings || isUpdatingSettings}
                isLoading={isUpdatingSettings}
                variant={settings.enable_bilingual_cities ? 'success-dark' : 'success'}
                className="w-32"
              >
                {settings.enable_bilingual_cities ? 'Выключить' : 'Включить'}
              </Button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-red-600">Опасная зона</h4>
            <p className="text-sm text-gray-500 mt-1">
              Эти действия затрагивают данные вашего аккаунта и могут быть необратимы. Используйте с осторожностью.
            </p>
            
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

            <div className="p-4 border border-red-300 bg-red-50 rounded-lg">
              <h5 className="font-semibold text-red-800">Удалить абсолютно всё</h5>
              <p className="text-sm text-red-700 mt-1 mb-3">
                Это действие безвозвратно удалит ВСЕ ваши данные: расходы, категории, группы, ключевые слова.
              </p>
              <div className="space-y-2">
                <label className="text-xs text-gray-600">Для подтверждения, введите: <strong className="font-mono">удалить все данные</strong></label>
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
        </div>
      </Modal>
      <SelectiveDeleteModal 
        isOpen={isSelectiveDeleteModalOpen} 
        onClose={() => setIsSelectiveDeleteModalOpen(false)} 
      />
    </>
  )
}