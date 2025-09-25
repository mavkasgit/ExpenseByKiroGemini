'use client'

import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface TimeInputProps {
  value?: string
  onChange?: (value: string) => void
  onKeyPress?: (e: React.KeyboardEvent) => void
  onFocus?: () => void
  disabled?: boolean
  className?: string
  placeholder?: string
  title?: string
}

export interface TimeInputRef {
  focus: () => void
}

export const TimeInput = forwardRef<TimeInputRef, TimeInputProps>(function TimeInput({
  value = '',
  onChange,
  onKeyPress,
  onFocus,
  disabled = false,
  className = '',
  placeholder = 'ЧЧ:ММ',
  title = 'Время'
}, ref) {
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [focused, setFocused] = useState(false)
  const hoursRef = useRef<HTMLInputElement>(null)
  const minutesRef = useRef<HTMLInputElement>(null)

  // Предоставляем методы для родительского компонента
  useImperativeHandle(ref, () => ({
    focus: () => {
      hoursRef.current?.focus()
    }
  }))

  // Парсим входящее значение
  useEffect(() => {
    if (value && value.includes(':')) {
      const [h, m] = value.split(':')
      setHours(h || '')
      setMinutes(m || '')
    } else if (!value) {
      setHours('')
      setMinutes('')
    }
  }, [value])

  // Форматируем и отправляем значение
  const updateValue = (newHours: string, newMinutes: string) => {
    if (newHours && newMinutes) {
      const formattedTime = `${newHours.padStart(2, '0')}:${newMinutes.padStart(2, '0')}`
      onChange?.(formattedTime)
    } else if (!newHours && !newMinutes) {
      onChange?.('')
    }
  }

  // Обработка изменения часов
  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value.replace(/\D/g, '') // Только цифры
    
    if (newValue.length > 2) {
      newValue = newValue.slice(0, 2)
    }
    
    if (newValue && parseInt(newValue) > 23) {
      newValue = '23'
    }
    
    setHours(newValue)
    updateValue(newValue, minutes)
    
    // Автопереход к минутам при вводе 2 цифр
    if (newValue.length === 2) {
      minutesRef.current?.focus()
    }
  }

  // Обработка изменения минут
  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value.replace(/\D/g, '') // Только цифры
    
    if (newValue.length > 2) {
      newValue = newValue.slice(0, 2)
    }
    
    if (newValue && parseInt(newValue) > 59) {
      newValue = '59'
    }
    
    setMinutes(newValue)
    updateValue(hours, newValue)
  }

  // Обработка клавиш
  const handleKeyDown = (e: React.KeyboardEvent, field: 'hours' | 'minutes') => {
    // Передаем событие родителю для обработки Enter
    if (e.key === 'Enter') {
      onKeyPress?.(e)
      return
    }

    // Навигация между полями
    if (e.key === 'ArrowRight' && field === 'hours') {
      e.preventDefault()
      minutesRef.current?.focus()
    } else if (e.key === 'ArrowLeft' && field === 'minutes') {
      e.preventDefault()
      hoursRef.current?.focus()
    }
    
    // Backspace в пустом поле минут переходит к часам
    if (e.key === 'Backspace' && field === 'minutes' && !minutes) {
      e.preventDefault()
      hoursRef.current?.focus()
    }
    
    // Двоеточие переходит к минутам
    if (e.key === ':' && field === 'hours') {
      e.preventDefault()
      minutesRef.current?.focus()
    }
  }

  const baseStyles = 'block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 transition-colors'
  const focusStyles = focused ? 'ring-2 ring-indigo-600' : 'ring-gray-300'
  const disabledStyles = disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'

  return (
    <div className={cn('relative', className)} title={title}>
      <div
        className={cn(
          'flex items-center gap-1 border rounded-md px-1.5 py-2 bg-white',
          focused ? 'ring-2 ring-indigo-600 border-transparent' : 'border-gray-300',
          disabled && 'bg-gray-50 cursor-not-allowed'
        )}
        onClick={() => {
          if (!disabled) {
            hoursRef.current?.focus()
          }
        }}
        onFocus={() => {
          setFocused(true)
          onFocus?.()
        }}
        onBlur={() => setFocused(false)}
      >
        {/* Поле часов */}
        <input
          ref={hoursRef}
          type="text"
          inputMode="numeric"
          value={hours}
          onChange={handleHoursChange}
          onKeyDown={(e) => handleKeyDown(e, 'hours')}
          disabled={disabled}
          placeholder="ЧЧ"
          className="w-7 text-center border-0 outline-none bg-transparent text-gray-900 placeholder:text-gray-400"
          maxLength={2}
        />
        
        {/* Разделитель */}
        <span className="text-gray-500 mx-0.5">:</span>

        {/* Поле минут */}
        <input
          ref={minutesRef}
          type="text"
          inputMode="numeric"
          value={minutes}
          onChange={handleMinutesChange}
          onKeyDown={(e) => handleKeyDown(e, 'minutes')}
          disabled={disabled}
          placeholder="ММ"
          className="w-7 text-center border-0 outline-none bg-transparent text-gray-900 placeholder:text-gray-400"
          maxLength={2}
        />
      </div>


    </div>
  )
})