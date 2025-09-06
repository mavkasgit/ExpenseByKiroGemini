# Реализация отдельного поля для города

## Обзор
Добавлено отдельное поле `city` в таблицу expenses и обновлен интерфейс для отображения города в отдельной колонке вместо колонки категорий.

## ✅ Внесенные изменения

### 1. База данных
**Файл:** `migrations/add_city_field_to_expenses.sql`

```sql
-- Добавляем поле city
ALTER TABLE expenses 
ADD COLUMN city VARCHAR(100);

-- Добавляем комментарий
COMMENT ON COLUMN expenses.city IS 'Город, извлеченный из описания транзакции';

-- Создаем индексы
CREATE INDEX idx_expenses_city ON expenses(city) WHERE city IS NOT NULL;
CREATE INDEX idx_expenses_user_city ON expenses(user_id, city) WHERE city IS NOT NULL;
```

### 2. Типы TypeScript
**Файл:** `src/types/index.ts`

Добавлено поле `city: string | null` в:
- `expenses.Row`
- `expenses.Insert` 
- `expenses.Update`
- `CreateExpenseData`

### 3. Валидация Zod
**Файл:** `src/lib/validations/expenses.ts`

Добавлена валидация для поля city:
```typescript
city: z.string()
  .max(100, 'Название города не должно превышать 100 символов')
  .nullable()
  .optional()
```

### 4. Actions для создания расходов
**Файл:** `src/lib/actions/expenses.ts`

Обновлены функции:
- `createExpense()` - добавлено поле `city`
- `createBulkExpenses()` - добавлено поле `city`

### 5. Логика извлечения городов
**Файл:** `src/components/expense-input/bulk-input/BulkExpenseInput.tsx`

**Было:**
```typescript
const cityParseResult = extractCityFromDescription(expenseData.description)
if (cityParseResult.confidence > 0.6) {
  cleanDescription = cityParseResult.cleanDescription
  if (cityParseResult.city) {
    const cityNote = `Город: ${cityParseResult.city}`
    notes = notes ? `${notes}\n${cityNote}` : cityNote
  }
}
```

**Стало:**
```typescript
const cityParseResult = extractCityFromDescription(expenseData.description)
let extractedCity: string | null = null
if (cityParseResult.confidence > 0.6) {
  cleanDescription = cityParseResult.cleanDescription
  extractedCity = cityParseResult.city
}

// В объекте расхода:
city: extractedCity
```

### 6. Интерфейс таблицы
**Файл:** `src/components/expense-input/bulk-input/BulkExpenseTable.tsx`

**Изменения:**
- ❌ Убрана колонка "Категория"
- ✅ Добавлена колонка "Город"
- ❌ Убран `SearchableSelect` для категорий
- ✅ Добавлен `Input` для города
- ❌ Убран проп `categories`
- ❌ Убраны `categoryOptions`

**Новая колонка:**
```tsx
<th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700 w-32">
  Город
</th>

{/* В ячейке */}
<td className="border border-gray-300 px-1 py-1">
  <Input
    type="text"
    value={expense.city || ''}
    onChange={(e) => handleCellChange(tempId, 'city', e.target.value)}
    placeholder="Город"
    className="text-sm border-0 focus:ring-0 p-1"
  />
</td>
```

## 🎯 Преимущества изменений

### 1. Улучшенная структура данных
- ✅ Город хранится в отдельном поле, а не в примечаниях
- ✅ Возможность фильтрации и поиска по городу
- ✅ Индексы для быстрого поиска по городу

### 2. Упрощенный интерфейс
- ✅ Убрана колонка категорий (автоопределяется)
- ✅ Город отображается в отдельной колонке
- ✅ Пользователь может редактировать город вручную
- ✅ Меньше визуального шума в таблице

### 3. Автоматизация
- ✅ Город автоматически извлекается из описания
- ✅ Категория автоматически определяется системой
- ✅ Пользователь видит результат извлечения и может исправить

## 📊 Структура таблицы после изменений

| № | Сумма | Описание | Дата | Время | Город | Примечания | Действия |
|---|-------|----------|------|-------|-------|------------|----------|
| 1 | 3.74 | Shop Belmarket N205 | 01.01.2025 | 14:06 | LOGOYSK | | 🗑️ |
| 2 | 9.24 | Supermarket Green Bapb | 31.12.2024 | 18:31 | MINSK | | 🗑️ |

## 🔄 Миграция данных

### Существующие записи:
- Поле `city` будет `NULL` для существующих записей
- Примечания с "Город: ..." останутся как есть
- При редактировании можно перенести город из примечаний в поле

### Новые записи:
- Город автоматически извлекается и сохраняется в поле `city`
- Примечания остаются чистыми
- Категория автоматически определяется

## 🟢 Статус: ЗАВЕРШЕНО

Реализация завершена:
- ✅ **База данных** - добавлено поле city с индексами
- ✅ **Типы** - обновлены все TypeScript типы
- ✅ **Валидация** - добавлена Zod валидация
- ✅ **Actions** - обновлены функции создания расходов
- ✅ **Интерфейс** - заменена колонка категорий на город
- ✅ **Логика** - город сохраняется в отдельном поле
- ✅ **Компиляция** - все изменения успешно скомпилированы

Теперь город отображается в отдельной колонке и сохраняется в структурированном виде! 🎉