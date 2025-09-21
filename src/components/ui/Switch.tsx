'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

// Определяем пропсы для нашего кастомного свитча, наследуя стандартные атрибуты инпута
interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
  /**
   * Управляет визуальным размером переключателя.
   * `md` совпадает с прежним вариантом, `sm` и `lg` дают компактный и крупный варианты.
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Подпись рядом с переключателем. Делает компонент самодостаточным и улучшает доступность.
   */
  label?: React.ReactNode
  /**
   * Дополнительное описание под подписью, помогает раскрыть контекст переключателя.
   */
  description?: React.ReactNode
}

const trackSizes = {
  sm: 'h-5 w-9 px-[3px]',
  md: 'h-6 w-11 px-[4px]',
  lg: 'h-8 w-14 px-[6px]'
} as const

const thumbSizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6'
} as const

const thumbTranslations = {
  sm: 'translate-x-[14px]',
  md: 'translate-x-[20px]',
  lg: 'translate-x-[26px]'
} as const

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      className,
      checked,
      defaultChecked,
      onCheckedChange,
      onChange,
      size = 'md',
      label,
      description,
      id: providedId,
      disabled,
      ...rest
    },
    ref
  ) => {
    const [isChecked, setIsChecked] = React.useState(
      checked ?? defaultChecked ?? false
    )

    React.useEffect(() => {
      if (checked !== undefined) {
        setIsChecked(checked)
      }
    }, [checked])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (checked === undefined) {
        setIsChecked(e.target.checked)
      }

      onCheckedChange?.(e.target.checked)
      onChange?.(e)
    }

    const generatedId = React.useId()
    const controlId = providedId ?? generatedId
    const descriptionId = description ? `${controlId}-description` : undefined

    return (
      <label
        htmlFor={controlId}
        className={cn(
          'group inline-flex w-fit cursor-pointer items-start gap-3',
          disabled && 'cursor-not-allowed opacity-60',
          className
        )}
      >
        <span className="relative flex items-center justify-center">
          <span
            className={cn(
              'absolute h-full w-full rounded-full blur-xl transition-opacity duration-300',
              isChecked ? 'opacity-70 bg-primary/30' : 'opacity-0 bg-slate-300/30',
              !disabled && 'group-hover:opacity-80'
            )}
            aria-hidden
          />
          <input
            type="checkbox"
            id={controlId}
            ref={ref}
            {...rest}
            disabled={disabled}
            checked={isChecked}
            onChange={handleChange}
            className="peer sr-only"
            aria-describedby={descriptionId}
          />
          <span
            aria-hidden="true"
            className={cn(
              'relative inline-flex shrink-0 items-center rounded-full border border-transparent bg-muted transition-all duration-300 ease-out',
              trackSizes[size],
              disabled ? 'cursor-not-allowed' : 'cursor-pointer',
              'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-primary/45 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-white',
              isChecked &&
                'bg-gradient-to-r from-primary to-primary/70 shadow-[0_10px_30px_-12px_rgba(79,70,229,0.55)]'
            )}
          >
            <span
              className={cn(
                'absolute inset-0 rounded-full bg-primary/20 opacity-0 transition-opacity duration-300 ease-out',
                isChecked && 'opacity-100',
                !disabled && 'group-hover:opacity-60'
              )}
            />
            <span
              className={cn(
                'relative inline-flex items-center justify-center rounded-full bg-background text-xs font-semibold text-muted-foreground shadow-sm ring-0 transition-all duration-300 ease-out',
                thumbSizes[size],
                isChecked ? thumbTranslations[size] : 'translate-x-0',
                isChecked && 'text-primary'
              )}
            >
              <span className="sr-only">{isChecked ? 'Включено' : 'Выключено'}</span>
            </span>
          </span>
        </span>

        {(label || description) && (
          <span className="flex min-w-0 flex-col leading-none">
            {label && (
              <span className="text-sm font-medium text-slate-900 transition-colors duration-200 group-hover:text-primary">
                {label}
              </span>
            )}
            {description && (
              <span
                id={descriptionId}
                className="mt-1 text-xs text-slate-500"
              >
                {description}
              </span>
            )}
          </span>
        )}
      </label>
    )
  }
)

Switch.displayName = 'Switch'

export { Switch }
