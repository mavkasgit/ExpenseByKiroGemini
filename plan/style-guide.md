# Руководство по стилям для Expense Tracker

## Общие принципы

### 1. Структура компонентов
- Всегда используйте `'use client'` для клиентских компонентов
- Импорты должны быть сгруппированы: React → UI компоненты → Actions → Types
- Используйте TypeScript интерфейсы для всех props

### 2. Стилизация
- Используйте Tailwind CSS классы
- Применяйте `cn()` функцию для условных классов
- Цвета текста должны быть явными: `text-gray-900` вместо прозрачных
- Минимальная ширина для Toast уведомлений: `min-w-[400px]`

### 3. Выпадающие списки
- Всегда используйте `SearchableSelect` вместо обычных `<select>`
- Включайте поиск по тексту для лучшего UX
- Показывайте цветные индикаторы для категорий

## Паттерны компонентов

### UI Components

#### Button
```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}
```

#### Input
```tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  variant?: 'default' | 'filled'
}
```

#### Modal
```tsx
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
}
```

#### ErrorMessage
```tsx
interface ErrorMessageProps {
  error: string // НЕ message!
  onDismiss?: () => void // НЕ onClose!
  showDismiss?: boolean
}
```

### Server Actions

#### Структура
```tsx
'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { validationSchema } from '@/lib/validations/...'
import type { DataType } from '@/types'

export async function actionName(data: DataType) {
  const supabase = await createServerClient()

  try {
    // 1. Проверка авторизации
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    // 2. Валидация данных
    const validatedData = validationSchema.parse(data)

    // 3. Операция с БД
    const { data: result, error } = await supabase
      .from('table_name')
      .operation(validatedData)
      .select()

    if (error) {
      console.error('Ошибка операции:', error)
      return { error: 'Описание ошибки для пользователя' }
    }

    // 4. Revalidation
    revalidatePath('/relevant-path')
    return { success: true, data: result }
  } catch (err) {
    console.error('Ошибка валидации:', err)
    return { error: 'Неверные данные' }
  }
}
```

### Компоненты форм

#### Структура состояния
```tsx
const [formData, setFormData] = useState<FormDataType>({
  field1: '',
  field2: '',
  // ...
})
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
```

#### Обработка отправки
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  if (!formData.requiredField.trim()) {
    setError('Заполните все обязательные поля')
    return
  }

  setLoading(true)
  const result = await serverAction(formData)

  if (result.error) {
    setError(result.error)
    setToast({ message: result.error, type: 'error' })
  } else {
    setToast({ message: 'Операция выполнена успешно', type: 'success' })
    // Сброс формы или закрытие модального окна
  }
  setLoading(false)
}
```

## Частые ошибки и их исправления

### 1. Прозрачный текст в select
❌ **Неправильно:**
```tsx
<option value={category.id}>
  {category.name}
</option>
```

✅ **Правильно:**
```tsx
<SearchableSelect
  options={categories.map(category => ({
    value: category.id,
    label: category.name,
    color: category.color || undefined
  }))}
  value={selectedValue}
  onChange={setValue}
/>
```

### 2. Узкие Toast уведомления
❌ **Неправильно:**
```tsx
className="max-w-sm w-full"
```

✅ **Правильно:**
```tsx
className="max-w-md w-full min-w-[400px]"
```

### 3. Неправильные props для ErrorMessage
❌ **Неправильно:**
```tsx
<ErrorMessage message={error} onClose={() => setError(null)} />
```

✅ **Правильно:**
```tsx
<ErrorMessage error={error} onDismiss={() => setError(null)} showDismiss />
```

### 4. Отсутствие поиска в выпадающих списках
❌ **Неправильно:**
```tsx
<select>
  {options.map(option => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  ))}
</select>
```

✅ **Правильно:**
```tsx
<SearchableSelect
  options={options}
  value={value}
  onChange={onChange}
  placeholder="Выберите опцию"
/>
```

### 5. Проблемы с типизацией nullable полей
❌ **Неправильно:**
```tsx
{iconMap[category.icon] || '📦'}
```

✅ **Правильно:**
```tsx
{iconMap[category.icon || 'other'] || '📦'}
```

### 6. Неправильная структура useEffect с зависимостями
❌ **Неправильно:**
```tsx
const loadData = async () => { /* ... */ }

useEffect(() => {
  loadData()
}, [someId])
```

✅ **Правильно:**
```tsx
const loadData = useCallback(async () => { /* ... */ }, [someId])

useEffect(() => {
  loadData()
}, [loadData])
```

## Соглашения по именованию

### Компоненты
- PascalCase для компонентов: `KeywordManager`
- camelCase для функций: `handleSubmit`
- SCREAMING_SNAKE_CASE для констант: `DEFAULT_VALUES`

### Файлы
- PascalCase для компонентов: `KeywordManager.tsx`
- camelCase для утилит: `categorization.ts`
- kebab-case для страниц: `reset-password/page.tsx`

### Props и состояние
- Булевы props начинаются с `is`, `has`, `can`, `should`: `isLoading`, `hasError`
- Обработчики событий начинаются с `on`: `onSubmit`, `onClose`
- Данные формы: `formData`, не `data`

## Структура директорий

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Группа маршрутов авторизации
│   ├── (dashboard)/       # Группа маршрутов дашборда
│   └── globals.css        # Глобальные стили
├── components/
│   ├── ui/                # Базовые UI компоненты
│   ├── forms/             # Компоненты форм
│   ├── layout/            # Компоненты макета
│   └── [feature]/         # Компоненты по функциональности
├── lib/
│   ├── actions/           # Server Actions
│   ├── utils/             # Утилиты
│   ├── validations/       # Zod схемы
│   └── supabase/          # Конфигурация Supabase
└── types/
    └── index.ts           # TypeScript типы
```

## Контрольный список перед коммитом

- [ ] Все компоненты имеют правильные TypeScript типы
- [ ] Используется `SearchableSelect` вместо обычных select
- [ ] Toast уведомления имеют достаточную ширину
- [ ] ErrorMessage использует правильные props (`error`, `onDismiss`)
- [ ] Nullable поля обрабатываются корректно
- [ ] useEffect имеет правильные зависимости
- [ ] Server Actions следуют стандартной структуре
- [ ] Все тексты читаемы (не прозрачные)
- [ ] Проект компилируется без ошибок: `npm run build`

## Примеры правильной реализации

### Компонент с формой и поиском
```tsx
'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { SimpleToast } from '@/components/ui/Toast'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { createItem } from '@/lib/actions/items'
import type { Category, CreateItemData } from '@/types'

interface ItemFormProps {
  categories: Category[]
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ItemForm({ categories, isOpen, onClose, onSuccess }: ItemFormProps) {
  const [formData, setFormData] = useState<CreateItemData>({
    name: '',
    category_id: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.category_id) {
      setError('Заполните все обязательные поля')
      return
    }

    setLoading(true)
    setError(null)

    const result = await createItem(formData)

    if (result.error) {
      setError(result.error)
      setToast({ message: result.error, type: 'error' })
    } else {
      setToast({ message: 'Элемент успешно создан', type: 'success' })
      setFormData({ name: '', category_id: '', description: '' })
      onSuccess()
      onClose()
    }
    setLoading(false)
  }, [formData, onSuccess, onClose])

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Создать элемент">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <ErrorMessage error={error} onDismiss={() => setError(null)} showDismiss />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Категория *
            </label>
            <SearchableSelect
              options={categories.map(category => ({
                value: category.id,
                label: category.name,
                color: category.color || undefined
              }))}
              value={formData.category_id}
              onChange={(value) => setFormData({ ...formData, category_id: value })}
              placeholder="Выберите категорию"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" isLoading={loading}>
              Создать
            </Button>
          </div>
        </form>
      </Modal>

      {toast && (
        <SimpleToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  )
}
```

Это руководство поможет избежать повторяющихся ошибок и обеспечить консистентность кода в проекте.