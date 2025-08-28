# Быстрая справка - Expense Tracker

## 🚨 Критические правила (ВСЕГДА проверять!)

### 1. UI Компоненты
- ✅ `SearchableSelect` вместо `<select>`
- ✅ `text-gray-900` для читаемого текста (НЕ прозрачный)
- ✅ `min-w-[400px]` для Toast уведомлений
- ✅ `error` и `onDismiss` для ErrorMessage (НЕ `message` и `onClose`)

### 2. TypeScript
- ✅ `category.icon || 'other'` для nullable полей
- ✅ `useCallback` для функций в useEffect зависимостях
- ✅ Экранирование кавычек: `&quot;` вместо `"`

### 3. Server Actions
- ✅ Только async функции в файлах с `'use server'`
- ✅ Утилиты в отдельные файлы (не в server actions)
- ✅ Проверка авторизации в каждом action

## 📋 Шаблоны кода

### Компонент с формой
```tsx
'use client'

import { useState, useCallback } from 'react'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { SimpleToast } from '@/components/ui/Toast'

export function MyComponent({ categories }: Props) {
  const [formData, setFormData] = useState({ field: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{message: string; type: 'success'|'error'} | null>(null)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await serverAction(formData)
    
    if (result.error) {
      setError(result.error)
      setToast({ message: result.error, type: 'error' })
    } else {
      setToast({ message: 'Успешно!', type: 'success' })
    }
    setLoading(false)
  }, [formData])

  return (
    <>
      <form onSubmit={handleSubmit}>
        {error && (
          <ErrorMessage error={error} onDismiss={() => setError(null)} showDismiss />
        )}
        
        <SearchableSelect
          options={categories.map(cat => ({
            value: cat.id,
            label: cat.name,
            color: cat.color || undefined
          }))}
          value={formData.field}
          onChange={(value) => setFormData({...formData, field: value})}
        />
      </form>

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

### Server Action
```tsx
'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { schema } from '@/lib/validations/...'

export async function myAction(data: DataType) {
  const supabase = await createServerClient()

  try {
    // 1. Авторизация
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    // 2. Валидация
    const validatedData = schema.parse(data)

    // 3. Операция
    const { data: result, error } = await supabase
      .from('table')
      .insert({ ...validatedData, user_id: user.id })

    if (error) {
      console.error('DB Error:', error)
      return { error: 'Понятное сообщение для пользователя' }
    }

    // 4. Revalidation
    revalidatePath('/relevant-path')
    return { success: true, data: result }
  } catch (err) {
    console.error('Validation Error:', err)
    return { error: 'Неверные данные' }
  }
}
```

## 🔧 Быстрые исправления

### Прозрачный текст в select
```tsx
// ❌ ПЛОХО
<select>
  <option>{name}</option>
</select>

// ✅ ХОРОШО  
<SearchableSelect
  options={[{value: id, label: name}]}
  value={selected}
  onChange={setSelected}
/>
```

### Узкие Toast
```tsx
// ❌ ПЛОХО
className="max-w-sm"

// ✅ ХОРОШО
className="max-w-md min-w-[400px]"
```

### Nullable поля
```tsx
// ❌ ПЛОХО
{iconMap[category.icon]}

// ✅ ХОРОШО
{iconMap[category.icon || 'other']}
```

### ErrorMessage props
```tsx
// ❌ ПЛОХО
<ErrorMessage message={error} onClose={clear} />

// ✅ ХОРОШО
<ErrorMessage error={error} onDismiss={clear} showDismiss />
```

### useEffect зависимости
```tsx
// ❌ ПЛОХО
const load = async () => {...}
useEffect(() => { load() }, [id])

// ✅ ХОРОШО
const load = useCallback(async () => {...}, [id])
useEffect(() => { load() }, [load])
```

## 🚀 Команды для проверки

```bash
# Проверка компиляции
npm run build

# Проверка типов
npx tsc --noEmit

# Линтинг
npm run lint
```

## 📁 Структура файлов

```
src/
├── app/                    # Next.js страницы
├── components/
│   ├── ui/                # Базовые компоненты
│   └── [feature]/         # Функциональные компоненты
├── lib/
│   ├── actions/           # Server Actions
│   ├── utils/             # Утилиты (НЕ server actions)
│   └── validations/       # Zod схемы
└── types/                 # TypeScript типы
```

## ⚡ Горячие клавиши для отладки

- `Ctrl+Shift+I` - DevTools
- `F12` - Console
- `Ctrl+Shift+C` - Inspect Element
- `Ctrl+R` - Reload
- `Ctrl+Shift+R` - Hard Reload

Держите эту справку под рукой при разработке! 🎯