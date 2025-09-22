'use client'

import { useState, useTransition, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { DatePicker } from '@/components/ui/DatePicker'
import { TimeInput } from '@/components/ui/TimeInput'
import { createExpense } from '@/lib/actions/expenses'
import { getCurrentDateISO } from '@/lib/utils/dateUtils'
import type { CreateExpenseData } from '@/types'
import { useToast } from '@/hooks/useToast'
import { getUserSettings, UserSettings } from '@/lib/actions/settings'

interface ExpenseFormProps {
  onSuccess?: (expense: any) => void
  onCancel?: () => void
  defaultValues?: Partial<CreateExpenseData>
  className?: string
}

export function ExpenseForm({ 
  onSuccess, 
  onCancel, 
  defaultValues,
  className = '' 
}: ExpenseFormProps) {
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { showToast } = useToast()
  const [userSettings, setUserSettings] = useState<UserSettings>({});

  useEffect(() => {
    const fetchSettings = async () => {
      const result = await getUserSettings();
      if (result.settings) {
        setUserSettings(result.settings);
      }
    };
    fetchSettings();
  }, []);

  // Состояние формы - убираем category_id, система сама определит категорию
  const [formData, setFormData] = useState({
    amount: defaultValues?.amount || 0,
    description: defaultValues?.description || '',
    notes: defaultValues?.notes || '',
    expense_date: defaultValues?.expense_date || getCurrentDateISO(),
    expense_time: defaultValues?.expense_time || '',
    city: defaultValues?.city_id || '',
    input_method: 'single' as const
  })

  // Валидация в реальном времени
  const validateField = (name: string, value: any) => {
    const newErrors = { ...errors }

    switch (name) {
      case 'amount':
        if (!value || value <= 0) {
          newErrors.amount = 'Сумма должна быть больше 0'
        } else if (value > 999999.99) {
          newErrors.amount = 'Сумма не должна превышать 999,999.99'
        } else {
          delete newErrors.amount
        }
        break

      case 'description':
        if (!value || value.trim().length === 0) {
          newErrors.description = 'Описание обязательно для автоматической категоризации'
        } else if (value.length > 500) {
          newErrors.description = 'Описание не должно превышать 500 символов'
        } else {
          delete newErrors.description
        }
        break

      case 'notes':
        if (value && value.length > 1000) {
          newErrors.notes = 'Примечание не должно превышать 1000 символов'
        } else {
          delete newErrors.notes
        }
        break

      case 'expense_time':
        if (value && value.trim()) {
          const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
          if (!timeRegex.test(value.trim())) {
            newErrors.expense_time = 'Время должно быть в формате ЧЧ:ММ (например, 14:30)'
          } else {
            delete newErrors.expense_time
          }
        } else {
          delete newErrors.expense_time
        }
        break

      case 'expense_date':
        if (!value) {
          newErrors.expense_date = 'Дата обязательна'
        } else {
          const date = new Date(value)
          const now = new Date()
          const maxDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
          
          if (isNaN(date.getTime())) {
            newErrors.expense_date = 'Неверный формат даты'
          } else if (date > maxDate) {
            newErrors.expense_date = 'Дата не может быть в будущем более чем на год'
          } else {
            delete newErrors.expense_date
          }
        }
        break;

      case 'city':
        if (value && value.length > 100) {
          newErrors.city = 'Название города не должно превышать 100 символов';
        } else {
          delete newErrors.city;
        }
        break;
    }

    setErrors(newErrors)
  }

  // Обработка изменений полей
  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    validateField(name, value)
  }

  // Обработка нажатия клавиш
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  // Отправка формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Валидируем все поля
    Object.keys(formData).forEach(key => {
      validateField(key, formData[key as keyof typeof formData])
    })

    // Проверяем наличие ошибок
    if (Object.keys(errors).length > 0) {
      showToast('Исправьте ошибки в форме', 'error')
      return
    }

    startTransition(async () => {
      try {
        // Создаем расход без указания категории - система сама определит
        const expenseData: CreateExpenseData = {
          amount: formData.amount,
          description: formData.description,
          notes: formData.notes || undefined,
          expense_date: formData.expense_date,
          expense_time: formData.expense_time || undefined,
          city_id: formData.city || undefined,
          input_method: formData.input_method
          // category_id не указываем - система автоматически определит или поместит в неопознанные
        }

        const result = await createExpense(expenseData)

        if (result.error) {
          showToast(result.error, 'error')
          return
        }

        // Показываем результат категоризации
        if (result.data?.auto_categorized) {
          showToast('Расход добавлен и автоматически категоризирован', 'success')
        } else {
          showToast('Расход добавлен в неопознанные. Вы можете назначить категорию позже.', 'info')
        }
        
        // Сбрасываем форму
        setFormData({
          amount: 0,
          description: '',
          notes: '',
          expense_date: getCurrentDateISO(),
          expense_time: '',
          city: '',
          input_method: 'single'
        })
        setErrors({})

        // Вызываем callback
        if (onSuccess) {
          onSuccess(result.data)
        }
      } catch (error) {
        console.error('Ошибка создания расхода:', error)
        showToast('Произошла ошибка при создании расхода', 'error')
      }
    })
  }

  // Обработка изменения описания
  const handleDescriptionChange = (value: string) => {
    handleFieldChange('description', value)
  }

  return (
    <Card className={`p-6 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Сумма */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Сумма *
            </label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              max="999999.99"
              value={formData.amount || ''}
              onChange={(e) => handleFieldChange('amount', parseFloat(e.target.value) || 0)}
              placeholder="0"
              className={errors.amount ? 'border-red-500' : ''}
              disabled={isPending}
            />
            {errors.amount && <ErrorMessage error={errors.amount} />}
          </div>

          {/* Дата */}
          <div>
            <label htmlFor="expense_date" className="block text-sm font-medium text-gray-700 mb-1">
              Дата *
            </label>
            <DatePicker
              value={formData.expense_date}
              onChange={(value) => handleFieldChange('expense_date', value)}
              className={errors.expense_date ? 'border-red-500' : ''}
              disabled={isPending}
              placeholder="Выберите дату"
            />
            {errors.expense_date && <ErrorMessage error={errors.expense_date} />}
          </div>

          {/* Время */}
          <div>
            <label htmlFor="expense_time" className="block text-sm font-medium text-gray-700 mb-1">
              Время
            </label>
            <TimeInput
              value={formData.expense_time}
              onChange={(value) => handleFieldChange('expense_time', value)}
              onKeyPress={handleKeyPress}
              disabled={isPending}
              className={errors.expense_time ? 'ring-red-500' : ''}
            />
            {errors.expense_time && <ErrorMessage error={errors.expense_time} />}
          </div>
        </div>

        {/* Город */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              Город
            </label>
            <Input
              id="city"
              type="text"
              value={formData.city}
              onChange={(e) => handleFieldChange('city', e.target.value)}
              placeholder="Лондон"
              maxLength={100}
              className={errors.city ? 'border-red-500' : ''}
              disabled={isPending}
            />
            {errors.city && <ErrorMessage error={errors.city} />}
          </div>
        </div>

        {/* Описание */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Описание *
          </label>
          <Input
            id="description"
            type="text"
            value={formData.description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Опишите расход для автоматической категоризации..."
            maxLength={500}
            className={errors.description ? 'border-red-500' : ''}
            disabled={isPending}
          />
          {errors.description && <ErrorMessage error={errors.description} />}
          {formData.description && (
            <div className="text-xs text-gray-500 mt-1">
              {formData.description.length}/500 символов
            </div>
          )}
          <div className="text-xs text-blue-600 mt-1">
            💡 Система автоматически определит категорию по описанию
          </div>
        </div>

        {/* Примечание */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Примечание
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            placeholder="Дополнительные заметки о расходе (необязательно)..."
            maxLength={1000}
            rows={3}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${errors.notes ? 'border-red-500' : ''}`}
            disabled={isPending}
          />
          {errors.notes && <ErrorMessage error={errors.notes} />}
          {formData.notes && (
            <div className="text-xs text-gray-500 mt-1">
              {formData.notes.length}/1000 символов
            </div>
          )}
        </div>

        {/* Кнопки */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isPending || Object.keys(errors).length > 0}
            className="flex-1"
          >
            {isPending ? 'Сохранение...' : 'Добавить расход'}
          </Button>
          
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
            >
              Отмена
            </Button>
          )}
        </div>
      </form>
    </Card>
  )
}