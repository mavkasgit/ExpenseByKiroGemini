# Руководство по устранению неполадок

## MCP (Model Context Protocol) проблемы

### Проблема с доступом к файловой системе

**Симптом:**
```
Error: Access denied - path outside allowed directories: d:\ExpenseByKiro\expense-tracker\src not in D:\ExpenseByKiro
```

**Причина:** MCP filesystem сервер настроен только на доступ к `D:\ExpenseByKiro`, но пути указываются с маленькой буквы диска.

**Решение:**
1. Используйте относительные пути от корня проекта:
   ```tsx
   // ❌ Неправильно
   mcp_filesystem_directory_tree("expense-tracker/src")
   
   // ✅ Правильно  
   listDirectory("expense-tracker/src", { depth: 3 })
   ```

2. Или обновите конфигурацию MCP в `.kiro/settings/mcp.json`:
   ```json
   {
     "mcpServers": {
       "filesystem": {
         "command": "uvx",
         "args": ["mcp-filesystem", "D:\\ExpenseByKiro", "d:\\ExpenseByKiro"],
         "disabled": false
       }
     }
   }
   ```

## Проблемы компиляции

### TypeScript ошибки типизации

**Симптом:**
```
Type 'null' cannot be used as an index type
```

**Решение:**
```tsx
// ❌ Неправильно
{iconMap[category.icon] || '📦'}

// ✅ Правильно
{iconMap[category.icon || 'other'] || '📦'}
```

### Проблемы с Server Actions

**Симптом:**
```
Server Actions must be async functions
```

**Решение:**
Все экспортируемые функции из файлов с `'use server'` должны быть асинхронными:
```tsx
// ❌ Неправильно
'use server'
export function extractKeywords(text: string) { ... }

// ✅ Правильно - вынести в отдельный утилитарный файл
// lib/utils/keywords.ts
export function extractKeywords(text: string) { ... }
```

### ESLint ошибки

**Симптом:**
```
React Hook useEffect has a missing dependency
```

**Решение:**
```tsx
// ❌ Неправильно
const loadData = async () => { ... }
useEffect(() => { loadData() }, [someId])

// ✅ Правильно
const loadData = useCallback(async () => { ... }, [someId])
useEffect(() => { loadData() }, [loadData])
```

**Симптом:**
```
`"` can be escaped with `&quot;`
```

**Решение:**
```tsx
// ❌ Неправильно
<span>для категории "{categoryName}"</span>

// ✅ Правильно
<span>для категории &quot;{categoryName}&quot;</span>
```

## Проблемы со стилями

### Прозрачный текст в select

**Симптом:** Текст в выпадающих списках отображается полупрозрачным

**Решение:**
```tsx
// ❌ Неправильно
<select className="...">
  <option value={id}>{name}</option>
</select>

// ✅ Правильно
<SearchableSelect
  options={items.map(item => ({
    value: item.id,
    label: item.name,
    color: item.color || undefined
  }))}
  value={selectedValue}
  onChange={setValue}
/>
```

### Узкие Toast уведомления

**Симптом:** Текст в уведомлениях обрезается

**Решение:**
```tsx
// ❌ Неправильно
className="max-w-sm w-full"

// ✅ Правильно
className="max-w-md w-full min-w-[400px]"
```

### Проблемы с Tailwind CSS

**Симптом:** Стили не применяются

**Проверьте:**
1. Правильность путей в `tailwind.config.ts`:
   ```ts
   content: [
     "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
     "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
     "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
   ]
   ```

2. Импорт глобальных стилей в `app/layout.tsx`:
   ```tsx
   import "./globals.css"
   ```

3. Содержимое `globals.css`:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

## Проблемы с Supabase

### Ошибки авторизации

**Симптом:**
```
User not authenticated
```

**Решение:**
1. Проверьте настройки Supabase в `.env.local`
2. Убедитесь, что используете правильный клиент:
   ```tsx
   // Для Server Actions
   const supabase = await createServerClient()
   
   // Для клиентских компонентов
   const supabase = createClient()
   ```

### RLS (Row Level Security) ошибки

**Симптом:**
```
new row violates row-level security policy
```

**Решение:**
1. Проверьте RLS политики в Supabase Dashboard
2. Убедитесь, что `user_id` правильно устанавливается:
   ```tsx
   const { data, error } = await supabase
     .from('table')
     .insert({ ...formData, user_id: user.id })
   ```

### Проблемы с типами Supabase

**Симптом:**
```
Property does not exist on type
```

**Решение:**
1. Обновите типы: `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts`
2. Используйте правильные типы:
   ```tsx
   export type Category = Database['public']['Tables']['categories']['Row']
   ```

## Проблемы производительности

### Медленная загрузка компонентов

**Решение:**
1. Используйте `React.lazy()` для больших компонентов:
   ```tsx
   const HeavyComponent = lazy(() => import('./HeavyComponent'))
   ```

2. Мемоизируйте дорогие вычисления:
   ```tsx
   const expensiveValue = useMemo(() => heavyCalculation(data), [data])
   ```

### Частые ре-рендеры

**Решение:**
1. Используйте `useCallback` для функций:
   ```tsx
   const handleClick = useCallback((id: string) => {
     onClick(id)
   }, [onClick])
   ```

2. Мемоизируйте компоненты:
   ```tsx
   const MemoizedComponent = memo(Component)
   ```

## Отладка

### Логирование

**Для разработки:**
```tsx
console.log('Debug info:', data)
console.error('Error occurred:', error)
```

**Для продакшена:**
```tsx
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data)
}
```

### Инструменты разработчика

1. **React Developer Tools** - для отладки компонентов
2. **Network tab** - для отладки запросов к API
3. **Console** - для просмотра ошибок JavaScript

### Проверка состояния приложения

```tsx
// Добавьте временный компонент для отладки
function DebugInfo({ data }: { data: any }) {
  if (process.env.NODE_ENV !== 'development') return null
  
  return (
    <pre className="bg-gray-100 p-4 text-xs overflow-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}
```

## Контрольный список для отладки

### При возникновении ошибки:
- [ ] Проверить консоль браузера на JavaScript ошибки
- [ ] Проверить Network tab на ошибки API
- [ ] Проверить логи сервера (если есть доступ)
- [ ] Воспроизвести ошибку в изолированной среде

### При проблемах со стилями:
- [ ] Проверить, что Tailwind CSS правильно настроен
- [ ] Убедиться, что классы не конфликтуют
- [ ] Проверить, что компонент правильно импортирует стили

### При проблемах с данными:
- [ ] Проверить типы данных
- [ ] Убедиться в правильности API запросов
- [ ] Проверить состояние авторизации
- [ ] Проверить RLS политики в Supabase

### При проблемах с производительностью:
- [ ] Использовать React Profiler
- [ ] Проверить количество ре-рендеров
- [ ] Оптимизировать тяжелые вычисления
- [ ] Проверить размер бандла

## Полезные команды

```bash
# Проверка типов
npm run type-check

# Сборка проекта
npm run build

# Линтинг
npm run lint

# Запуск в режиме разработки
npm run dev

# Анализ бандла
npm run analyze

# Очистка кэша Next.js
rm -rf .next

# Переустановка зависимостей
rm -rf node_modules package-lock.json
npm install
```

## Ресурсы для помощи

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

Это руководство поможет быстро диагностировать и решить большинство проблем, возникающих при разработке.