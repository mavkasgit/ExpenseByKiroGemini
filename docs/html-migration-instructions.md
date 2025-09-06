# Инструкция по добавлению поддержки HTML в базу данных

## Проблема
При загрузке HTML файлов возникает ошибка:
```
new row for relation "bank_statements" violates check constraint "bank_statements_file_type_check"
```

Это происходит потому, что в базе данных есть ограничение на поле `file_type`, которое не включает значение 'html'.

## Решение

### Вариант 1: Через Supabase Dashboard (Рекомендуется)

1. Откройте Supabase Dashboard
2. Перейдите в раздел "SQL Editor"
3. Выполните следующий SQL запрос:

```sql
-- Удаляем старое ограничение
ALTER TABLE bank_statements DROP CONSTRAINT IF EXISTS bank_statements_file_type_check;

-- Добавляем новое ограничение с поддержкой HTML
ALTER TABLE bank_statements ADD CONSTRAINT bank_statements_file_type_check 
CHECK (file_type IN ('csv', 'xlsx', 'ofx', 'html'));

-- Добавляем комментарии
COMMENT ON COLUMN bank_statements.file_type IS 'Тип файла выписки: csv, xlsx, ofx, html';
```

### Вариант 2: Через API endpoint

1. Перейдите на страницу `/admin/migrate`
2. Нажмите кнопку "Выполнить миграцию"
3. Дождитесь завершения процесса

### Вариант 3: Через командную строку

```bash
cd expense-tracker
node scripts/run-migration.js
```

## После выполнения миграции

1. Обновите типы в коде:

В файле `src/types/index.ts`:
```typescript
export type BankStatementFileType = 'csv' | 'xlsx' | 'ofx' | 'html'
```

В файле `src/lib/validations/bankStatements.ts`:
```typescript
file_type: z.enum(['csv', 'xlsx', 'ofx', 'html'], {
  errorMap: () => ({ message: 'Поддерживаются только форматы CSV, XLSX, OFX, HTML' })
}),
```

В файле `src/lib/utils/bankStatementParsers.ts`:
```typescript
export function getFileType(filename: string): 'csv' | 'xlsx' | 'ofx' | 'html' {
  const extension = filename.split('.').pop()?.toLowerCase()
  
  switch (extension) {
    case 'csv':
    case 'txt':
      return 'csv'
    case 'html':
    case 'htm':
      return 'html'  // Возвращаем 'html' вместо 'csv'
    case 'xlsx':
    case 'xls':
      return 'xlsx'
    case 'ofx':
      return 'ofx'
    default:
      throw new Error(`Неподдерживаемый формат файла: ${extension}`)
  }
}
```

## Проверка

После выполнения миграции попробуйте загрузить HTML файл. Ошибка должна исчезнуть.

## Откат (если нужно)

Если нужно откатить изменения:

```sql
-- Удаляем новое ограничение
ALTER TABLE bank_statements DROP CONSTRAINT IF EXISTS bank_statements_file_type_check;

-- Возвращаем старое ограничение
ALTER TABLE bank_statements ADD CONSTRAINT bank_statements_file_type_check 
CHECK (file_type IN ('csv', 'xlsx', 'ofx'));
```