'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

// Определяем пропсы для нашего кастомного свитча, наследуя стандартные атрибуты инпута
interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Мы можем добавить сюда специфичные для свитча пропсы в будущем, если понадобится
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, ...props }, ref) => {
    // Используем внутреннее состояние для отслеживания, включен ли свитч
    const [isChecked, setIsChecked] = React.useState(
      props.checked ?? props.defaultChecked ?? false
    )

    // Синхронизируем внутреннее состояние с пропсами
    React.useEffect(() => {
      if (props.checked !== undefined) {
        setIsChecked(props.checked);
      }
    }, [props.checked]);

    // Обработчик изменений, который вызывает внешний onChange
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // В управляемом режиме, родительский компонент обновит состояние через props.
      // В неуправляемом режиме, мы могли бы обновить внутреннее состояние, но текущая реализация
      // фокусируется на управляемом сценарии, который является основным для этого приложения.
      props.onChange?.(e)
    }

    // Генерируем уникальный ID для связи label и input, это важно для доступности
    const id = React.useId()

    return (
      <div className={cn('inline-flex items-center', className)}>
        <input
          type="checkbox"
          id={id}
          ref={ref}
          {...props}
          checked={isChecked} // Контролируем состояние инпута
          onChange={handleChange}
          className="sr-only" // Скрываем стандартный чекбокс
        />
        <label
          htmlFor={id}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            isChecked ? 'bg-primary' : 'bg-input',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform',
              isChecked ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </label>
      </div>
    )
  }
)

Switch.displayName = 'Switch'

export { Switch }