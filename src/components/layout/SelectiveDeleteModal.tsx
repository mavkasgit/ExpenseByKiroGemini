'use client'

import { useState, useEffect } from 'react'
import { Modal, Button, useToast } from '@/components/ui'
import { selectiveDelete } from '@/lib/actions/settings'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'

interface SelectiveDeleteModalProps {
  isOpen: boolean
  onClose: () => void
}

const deleteOptions = [
  { id: 'deleteExpenses', label: 'Все расходы', description: 'Удалить все записи о расходах.' },
  { id: 'deleteKeywords', label: 'Все ключевые слова', description: 'Удалить все созданные вами ключевые слова.' },
  { id: 'deleteCategories', label: 'Все категории', description: 'Удалить все категории. Расходы останутся без категорий.' },
  { id: 'deleteGroups', label: 'Все группы категорий', description: 'Удалить все группы. Категории останутся без групп.' },
  { id: 'deleteCitiesAndSynonyms', label: 'Все города и синонимы', description: 'Удалить все города и их альтернативные названия.' }, // Added new option
];

export function SelectiveDeleteModal({ isOpen, onClose }: SelectiveDeleteModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (isOpen) {
      try {
        const savedOptions = localStorage.getItem('selectiveDeleteOptions');
        if (savedOptions) {
          setSelectedOptions(JSON.parse(savedOptions));
        }
      } catch (error) {
        console.error("Failed to parse selective delete options from localStorage", error);
      }
    }
  }, [isOpen]);

  const handleCheckboxChange = (optionId: string) => {
    const newOptions = { ...selectedOptions, [optionId]: !selectedOptions[optionId] };
    setSelectedOptions(newOptions);
    try {
      localStorage.setItem('selectiveDeleteOptions', JSON.stringify(newOptions));
    } catch (error) {
      console.error("Failed to save selective delete options to localStorage", error);
    }
  }

  const handleDeleteRequest = () => {
    const optionsToDelete = Object.keys(selectedOptions).filter(key => selectedOptions[key]);
    if (optionsToDelete.length === 0) {
      toast.error('Выберите хотя бы одну опцию для удаления');
      return;
    }
    setIsConfirming(true);
  }

  const handleConfirmDelete = async () => {
    setIsLoading(true);
    try {
      const result = await selectiveDelete(selectedOptions);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message || 'Выбранные данные удалены');
        setIsConfirming(false);
        onClose();
        window.location.reload();
      }
    } catch (error) {
      toast.error('Произошла непредвиденная ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Выборочное удаление данных">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Выберите, какие данные вы хотите безвозвратно удалить. Это действие нельзя отменить.
          </p>
          
          <div className="space-y-3">
            {deleteOptions.map(option => (
              <div key={option.id} className="flex items-start p-3 border rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  id={option.id}
                  checked={!!selectedOptions[option.id]}
                  onChange={() => handleCheckboxChange(option.id)}
                  className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1"
                />
                <div className="ml-3 text-sm">
                  <label htmlFor={option.id} className="font-medium text-gray-900 cursor-pointer">
                    {option.label}
                  </label>
                  <p className="text-gray-500">{option.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 mt-4 border-t">
            <Button 
              variant="danger" 
              onClick={handleDeleteRequest} 
              disabled={isLoading || Object.values(selectedOptions).every(v => !v)}
              className="w-full"
            >
              {isLoading ? 'Удаление...' : 'Удалить выбранное'}
            </Button>
          </div>
        </div>
      </Modal>
      <ConfirmationModal 
        isOpen={isConfirming}
        onClose={() => setIsConfirming(false)}
        onConfirm={handleConfirmDelete}
        title="Подтвердите удаление"
        message={`Вы уверены, что хотите удалить выбранные данные? Это действие нельзя отменить.`}
        isLoading={isLoading}
      />
    </>
  );
}