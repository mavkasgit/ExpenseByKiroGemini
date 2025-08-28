# Архитектурное руководство для Expense Tracker

## Архитектурные принципы

### 1. Разделение ответственности
- **UI компоненты** (`/components/ui/`) - только отображение и базовая логика
- **Бизнес-компоненты** (`/components/[feature]/`) - логика конкретной функциональности
- **Server Actions** (`/lib/actions/`) - серверная логика и работа с БД
- **Утилиты** (`/lib/utils/`) - переиспользуемые функции
- **Типы** (`/types/`) - TypeScript определения

### 2. Паттерны состояния

#### Локальное состояние компонента
```tsx
// Для простых форм и UI состояний
const [isOpen, setIsOpen] = useState(false)
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
```

#### Состояние формы
```tsx
const [formData, setFormData] = useState<FormType>({
  field1: '',
  field2: '',
  // Всегда инициализируем все поля
})

// Обновление полей формы
const updateField = (field: keyof FormType, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }))
}
```

#### Асинхронные операции
```tsx
const [data, setData] = useState<DataType[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

const loadData = useCallback(async () => {
  setLoading(true)
  setError(null)
  
  try {
    const result = await serverAction()
    if (result.error) {
      setError(result.error)
    } else {
      setData(result.data || [])
    }
  } catch (err) {
    setError('Произошла ошибка при загрузке')
  } finally {
    setLoading(false)
  }
}, [/* dependencies */])
```

### 3. Обработка ошибок

#### На уровне Server Actions
```tsx
export async function serverAction(data: DataType) {
  try {
    // Проверка авторизации
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    // Валидация
    const validatedData = schema.parse(data)

    // Операция
    const { data: result, error } = await supabase
      .from('table')
      .insert(validatedData)

    if (error) {
      console.error('DB Error:', error)
      return { error: 'Понятное сообщение для пользователя' }
    }

    return { success: true, data: result }
  } catch (err) {
    console.error('Validation Error:', err)
    return { error: 'Неверные данные' }
  }
}
```

#### На уровне компонентов
```tsx
const handleAction = async () => {
  const result = await serverAction(data)
  
  if (result.error) {
    setError(result.error)
    setToast({ message: result.error, type: 'error' })
  } else {
    setToast({ message: 'Успешно выполнено', type: 'success' })
    // Дополнительные действия при успехе
  }
}
```

### 4. Типизация

#### Базовые типы из Supabase
```tsx
// В types/index.ts
export type Category = Database['public']['Tables']['categories']['Row']
export type Expense = Database['public']['Tables']['expenses']['Row']

// Расширенные типы
export type ExpenseWithCategory = Expense & {
  category: Category | null
}
```

#### Типы форм
```tsx
// Отдельные типы для создания и обновления
export type CreateCategoryData = {
  name: string
  color?: string
  icon?: string
  group_name?: string
}

export type UpdateCategoryData = Partial<CreateCategoryData>
```

#### Props интерфейсы
```tsx
interface ComponentProps {
  // Обязательные props
  data: DataType[]
  onAction: (id: string) => void
  
  // Опциональные props с значениями по умолчанию
  loading?: boolean
  variant?: 'default' | 'compact'
  
  // Callback props начинаются с 'on'
  onSuccess?: () => void
  onError?: (error: string) => void
}
```

### 5. Валидация данных

#### Zod схемы
```tsx
// В lib/validations/
import { z } from 'zod'

export const categorySchema = z.object({
  name: z.string()
    .min(1, 'Название обязательно')
    .max(100, 'Слишком длинное название')
    .trim(),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Неверный формат цвета')
    .optional(),
  icon: z.string()
    .min(1, 'Иконка обязательна')
    .optional()
})

export type CategoryData = z.infer<typeof categorySchema>
```

### 6. Работа с Supabase

#### Клиентские операции
```tsx
// Только для чтения данных в компонентах
const supabase = createClient()

const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('user_id', user.id)
```

#### Серверные операции
```tsx
// Для всех операций изменения данных
const supabase = await createServerClient()

// Всегда проверяем авторизацию
const { data: { user }, error: userError } = await supabase.auth.getUser()
if (userError || !user) {
  return { error: 'Не авторизован' }
}

// Операции с проверкой принадлежности пользователю
const { data, error } = await supabase
  .from('table')
  .insert({ ...data, user_id: user.id })
```

### 7. Компонентная архитектура

#### Композиция компонентов
```tsx
// Базовый компонент
export function BaseModal({ children, ...props }: ModalProps) {
  return <Modal {...props}>{children}</Modal>
}

// Специализированный компонент
export function ConfirmModal({ onConfirm, ...props }: ConfirmModalProps) {
  return (
    <BaseModal {...props}>
      <div className="space-y-4">
        {/* Содержимое */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={props.onClose}>
            Отмена
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Подтвердить
          </Button>
        </div>
      </div>
    </BaseModal>
  )
}
```

#### Паттерн Provider/Consumer
```tsx
// Для сложного состояния, которое нужно в нескольких компонентах
const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DataType[]>([])
  // ... логика управления данными
  
  return (
    <DataContext.Provider value={{ data, setData, /* ... */ }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within DataProvider')
  }
  return context
}
```

### 8. Производительность

#### Мемоизация
```tsx
// Для дорогих вычислений
const expensiveValue = useMemo(() => {
  return heavyCalculation(data)
}, [data])

// Для callback функций
const handleClick = useCallback((id: string) => {
  onItemClick(id)
}, [onItemClick])

// Для компонентов
const MemoizedComponent = memo(({ data }: Props) => {
  return <div>{/* render */}</div>
})
```

#### Ленивая загрузка
```tsx
// Для больших компонентов
const HeavyComponent = lazy(() => import('./HeavyComponent'))

function App() {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <HeavyComponent />
    </Suspense>
  )
}
```

### 9. Тестирование

#### Структура тестов
```tsx
// ComponentName.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { ComponentName } from './ComponentName'

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  it('should handle user interaction', async () => {
    const mockHandler = jest.fn()
    render(<ComponentName onAction={mockHandler} />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(mockHandler).toHaveBeenCalled()
  })
})
```

### 10. Безопасность

#### Валидация на сервере
```tsx
// Всегда валидируем данные на сервере
export async function serverAction(data: unknown) {
  try {
    const validatedData = schema.parse(data)
    // Продолжаем с валидированными данными
  } catch (error) {
    return { error: 'Неверные данные' }
  }
}
```

#### RLS (Row Level Security)
```sql
-- Всегда используем RLS для защиты данных
CREATE POLICY "Users can only see their own data" ON categories
  FOR ALL USING (auth.uid() = user_id);
```

#### Санитизация данных
```tsx
// Избегаем XSS атак
const sanitizedContent = DOMPurify.sanitize(userContent)
```

## Контрольный список архитектуры

### Перед созданием нового компонента
- [ ] Определена ответственность компонента
- [ ] Выбран правильный уровень абстракции
- [ ] Созданы необходимые TypeScript типы
- [ ] Продуман API компонента (props)

### Перед созданием Server Action
- [ ] Добавлена проверка авторизации
- [ ] Создана Zod схема валидации
- [ ] Обработаны все возможные ошибки
- [ ] Добавлен revalidatePath для обновления кэша

### Перед деплоем
- [ ] Все компоненты типизированы
- [ ] Нет console.log в продакшн коде
- [ ] Обработаны edge cases
- [ ] Добавлены loading состояния
- [ ] Проверена доступность (a11y)

## Примеры антипаттернов

### ❌ Плохо
```tsx
// Смешивание логики и UI
function BadComponent() {
  const [data, setData] = useState([])
  
  useEffect(() => {
    fetch('/api/data').then(res => res.json()).then(setData)
  }, [])
  
  return (
    <div>
      {data.map(item => (
        <div key={item.id} onClick={() => {
          fetch(`/api/delete/${item.id}`, { method: 'DELETE' })
            .then(() => setData(data.filter(d => d.id !== item.id)))
        }}>
          {item.name}
        </div>
      ))}
    </div>
  )
}
```

### ✅ Хорошо
```tsx
// Разделение ответственности
function GoodComponent() {
  const { data, loading, error, deleteItem } = useData()
  
  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  
  return (
    <div>
      {data.map(item => (
        <ItemCard 
          key={item.id} 
          item={item} 
          onDelete={() => deleteItem(item.id)} 
        />
      ))}
    </div>
  )
}
```

Это руководство поможет поддерживать чистую архитектуру и избегать технического долга в проекте.