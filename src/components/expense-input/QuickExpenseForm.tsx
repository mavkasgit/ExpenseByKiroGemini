'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { DatePicker } from '@/components/ui/DatePicker'
import { TimeInput } from '@/components/ui/TimeInput'
import { createExpense } from '@/lib/actions/expenses'
import { getCurrentDateISO, getCurrentTimeHHMM } from '@/lib/utils/dateUtils'
import type { CreateExpenseData } from '@/types'
import { useToast } from '@/hooks/useToast'

interface QuickExpenseFormProps {
  onSuccess?: (expense: any) => void
  className?: string
}

export function QuickExpenseForm({ 
  onSuccess,
  className = '' 
}: QuickExpenseFormProps) {
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()
  const amountInputRef = useRef<HTMLInputElement>(null)

  // Состояние формы - убираем category_id
  const [formData, setFormData] = useState({
    amount: 0,
    description: '',
    notes: '',
    expense_date: getCurrentDateISO(),
    expense_time: getCurrentTimeHHMM(),
    input_method: 'single' as const
  })

  // Фокус на поле суммы при монтировании
  useEffect(() => {
    if (amountInputRef.current) {
      amountInputRef.current.focus()
    }
  }, [])

  // Обработка изменения описания
  const handleDescriptionChange = (value: string) => {
    setFormData(prev => ({ ...prev, description: value }))
  }

  // Быстрая отправка формы (Enter в любом поле)
  const handleQuickSubmit = async () => {
    // Базовая валидация
    if (!formData.amount || formData.amount <= 0) {
      showToast('Введите сумму расхода', 'error')
      amountInputRef.current?.focus()
      return
    }

    if (!formData.description || formData.description.trim().length === 0) {
      showToast('Введите описание для автоматической категоризации', 'error')
      return
    }

    startTransition(async () => {
      try {
        // Создаем расход без указания категории
        const expenseData: CreateExpenseData = {
          amount: formData.amount,
          description: formData.description,
          notes: formData.notes || undefined,
          expense_date: formData.expense_date,
          expense_time: formData.expense_time || undefined,
          input_method: formData.input_method
          // category_id не указываем - система автоматически определит
        }

        const result = await createExpense(expenseData)

        if (result.error) {
          showToast(result.error, 'error')
          return
        }

        // Показываем результат категоризации
        if (result.data?.auto_categorized) {
          showToast('Расход добавлен и категоризирован', 'success')
        } else {
          showToast('Расход добавлен в неопознанные', 'info')
        }
        
        // Сбрасываем форму, но оставляем дату и обновляем время
        setFormData(prev => ({
          amount: 0,
          description: '',
          notes: '',
          expense_date: prev.expense_date, // Оставляем дату
          expense_time: getCurrentTimeHHMM(), // Обновляем время на текущее
          input_method: 'single'
        }))

        // Фокус обратно на сумму для следующего ввода
        setTimeout(() => {
          amountInputRef.current?.focus()
        }, 100)

        // Вызываем callback
        if (onSuccess) {
          onSuccess(result.data)
        }
      } catch (error) {
        console.error('Ошибка создания расхода:', error)
        showToast('Произошла ошибка', 'error')
      }
    })
  }

  // Обработка Enter в полях
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isPending) {
      e.preventDefault()
      handleQuickSubmit()
    }
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-700 mb-3">
          Быстрый ввод расхода
        </div>

        {/* Сумма и описание в одной строке */}
        <div className="grid grid-cols-2 gap-3">
          {/* Сумма */}
          <div>
            <Input
              ref={amountInputRef}
              type="number"
              step="0.01"
              min="0"
              value={formData.amount || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                amount: parseFloat(e.target.value) || 0 
              }))}
              onKeyPress={handleKeyPress}
              placeholder="Сумма"
              disabled={isPending}
              className="text-lg"
            />
          </div>

          {/* Описание */}
          <div>
            <Input
              type="text"
              value={formData.description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Описание для автокатегоризации"
              disabled={isPending}
            />
          </div>
        </div>

        {/* Примечание */}
        <div>
          <Input
            type="text"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              notes: e.target.value 
            }))}
            onKeyPress={handleKeyPress}
            placeholder="Примечание (необязательно)"
            disabled={isPending}
            maxLength={1000}
          />
        </div>

        {/* Дата и время */}
        <div className="grid grid-cols-2 gap-3">
          {/* Дата */}
          <div>
            <DatePicker
              value={formData.expense_date}
              onChange={(value) => setFormData(prev => ({ 
                ...prev, 
                expense_date: value 
              }))}
              onKeyPress={handleKeyPress}
              disabled={isPending}
              placeholder="Дата"
            />
          </div>

          {/* Время */}
          <div>
            <TimeInput
              value={formData.expense_time}
              onChange={(value) => setFormData(prev => ({ 
                ...prev, 
                expense_time: value 
              }))}
              onKeyPress={handleKeyPress}
              disabled={isPending}
            />
          </div>
        </div>

        <div className="text-xs text-blue-600">
          💡 Система определит категорию автоматически
        </div>

        {/* Кнопка добавления */}
        <Button
          onClick={handleQuickSubmit}
          disabled={isPending || !formData.amount || !formData.description.trim()}
          className="w-full"
          size="sm"
        >
          {isPending ? 'Добавление...' : 'Добавить (Enter)'}
        </Button>

        {/* Подсказка */}
        <div className="text-xs text-gray-500 text-center">
          Нажмите Enter в любом поле для быстрого добавления
        </div>
      </div>
    </Card>
  )
}