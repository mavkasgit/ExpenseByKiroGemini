# Лог миграций

## 2025-08-14 - Добавление поддержки HTML в банковские выписки

**Статус:** ✅ Выполнено

**Описание:** Добавлена поддержка HTML формата в таблицу `bank_statements`

**Выполненные изменения:**
1. Удалено старое ограничение `bank_statements_file_type_check`
2. Добавлено новое ограничение с поддержкой HTML: `CHECK (file_type IN ('csv', 'xlsx', 'ofx', 'html'))`
3. Добавлены комментарии к таблице и столбцу `file_type`

**SQL команды:**
```sql
-- Удаляем старое ограничение
ALTER TABLE bank_statements DROP CONSTRAINT IF EXISTS bank_statements_file_type_check;

-- Добавляем новое ограничение с поддержкой HTML
ALTER TABLE bank_statements ADD CONSTRAINT bank_statements_file_type_check 
CHECK (file_type IN ('csv', 'xlsx', 'ofx', 'html'));

-- Добавляем комментарии
COMMENT ON TABLE bank_statements IS 'Таблица для хранения информации о загруженных банковских выписках';
COMMENT ON COLUMN bank_statements.file_type IS 'Тип файла выписки: csv, xlsx, ofx, html';
```

**Проверка:**
- ✅ Ограничение обновлено корректно
- ✅ Тестовая запись с типом 'html' создается успешно
- ✅ Код обновлен для поддержки HTML типа

**Затронутые файлы:**
- `src/types/index.ts` - добавлен 'html' в BankStatementFileType
- `src/lib/validations/bankStatements.ts` - обновлена валидация
- `src/lib/utils/bankStatementParsers.ts` - обновлена функция getFileType
- `src/components/expense-input/bank-upload/BankStatementUpload.tsx` - убрано предупреждение

**Результат:** HTML файлы теперь корректно загружаются и обрабатываются системой без ошибок.

---

## 2025-01-15 - Добавление поля времени в расходы

**Статус:** ✅ Выполнено

**Описание:** Добавлено поле `expense_time` в таблицу `expenses` для сохранения времени из банковских выписок

**Выполненные изменения:**
1. Добавлен столбец `expense_time TIME NULL` в таблицу `expenses`
2. Добавлен комментарий к столбцу для документации
3. Создан индекс для оптимизации запросов по времени

**SQL команды:**
```sql
-- Добавляем поле времени
ALTER TABLE expenses 
ADD COLUMN expense_time TIME NULL;

-- Добавляем комментарий
COMMENT ON COLUMN expenses.expense_time IS 'Time component extracted from bank statements (HH:MM format)';

-- Создаем индекс для оптимизации
CREATE INDEX idx_expenses_expense_time ON expenses(expense_time) WHERE expense_time IS NOT NULL;
```

**Проверка:**
- ✅ Столбец добавлен успешно
- ✅ Индекс создан корректно
- ✅ Существующие записи не затронуты (expense_time = NULL)

**Затронутые файлы:**
- `src/types/index.ts` - добавлено поле expense_time в типы
- `src/lib/validations/expenses.ts` - добавлена валидация времени
- `src/lib/actions/expenses.ts` - обновлены server actions
- `src/lib/utils/bankStatementParsers.ts` - добавлена функция parseDateAndTime
- `src/components/expense-input/bulk-input/BulkExpenseInput.tsx` - обновлен для работы с временем

**Поддерживаемые форматы:**
- `06.01.2025 12:02` → дата: 2025-01-06, время: 12:02
- `6.1.2025 9:30` → дата: 2025-01-06, время: 09:30
- `06.01.2025` → дата: 2025-01-06, время: null

**Результат:** Время из банковских выписок теперь сохраняется и может быть использовано для детального отслеживания транзакций.