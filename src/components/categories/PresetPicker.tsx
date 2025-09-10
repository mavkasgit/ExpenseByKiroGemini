'use client'

import { useState } from 'react'
import { presets } from '@/lib/presets'
import { applyPreset } from '@/lib/actions/presets'
import { Button, useToast } from '@/components/ui'
import type { Category, CategoryGroup } from '@/types';

interface PresetPickerProps {
  onSuccess: (newGroups: CategoryGroup[], newCategories: Category[]) => void
}

export function PresetPicker({ onSuccess }: PresetPickerProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const toast = useToast()

  const handlePresetSelect = async (presetName: string) => {
    setIsLoading(presetName)
    try {
      const result = await applyPreset(presetName)
      if (result.success) {
        toast.success(`Пресет "${presetName}" успешно применен!`)
        onSuccess(result.newGroups, result.newCategories)
      } else {
        toast.error(result.error || 'Неизвестная ошибка при применении пресета')
      }
    } catch (error: any) {
      toast.error(error.message || 'Произошла непредвиденная ошибка')
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="w-full bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Начните с готового набора или создайте свой с нуля
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-500">
            Выберите один из шаблонов, чтобы мы создали для вас стандартный набор групп и категорий.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {presets.map(preset => (
            <div key={preset.name} className="border-2 rounded-2xl overflow-hidden bg-white shadow-lg transition-all hover:border-indigo-500 hover:shadow-2xl">
              <div className="p-6 text-center">
                <div className="text-6xl mb-4">{preset.emoji}</div>
                <h2 className="text-2xl font-bold text-gray-900">{preset.name}</h2>
                <p className="mt-2 text-base text-gray-600 h-10">{preset.description}</p>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <h4 className="font-semibold text-gray-700">Группы ({preset.groups.length})</h4>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600 list-disc pl-5">
                    {preset.groups.map(group => (
                      <li key={group.name}>{group.name}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700">Категории ({preset.categories.length})</h4>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600 list-disc pl-5">
                    {preset.categories.slice(0, 7).map(cat => (
                      <li key={cat.name}>{cat.name}</li>
                    ))}
                    {preset.categories.length > 7 && <li>... и еще {preset.categories.length - 7}</li>}
                  </ul>
                </div>
              </div>

              <div className="p-6 bg-white">
                <Button 
                  variant="primary"
                  className="w-full text-lg py-3"
                  onClick={() => handlePresetSelect(preset.name)}
                  isLoading={isLoading === preset.name}
                >
                  {isLoading === preset.name ? 'Создаем...' : `Выбрать "${preset.name}"`}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
