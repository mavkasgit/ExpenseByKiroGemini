# Expense Time Field Implementation

## Overview

Добавлено поле времени (`expense_time`) в таблицу расходов для сохранения времени из банковских выписок в формате "06.01.2025 12:02".

## Database Changes

### Migration: add_expense_time_field.sql
```sql
-- Add expense_time field to expenses table
ALTER TABLE expenses 
ADD COLUMN expense_time TIME NULL;

-- Add comment and index
COMMENT ON COLUMN expenses.expense_time IS 'Time component extracted from bank statements (HH:MM format)';
CREATE INDEX idx_expenses_expense_time ON expenses(expense_time) WHERE expense_time IS NOT NULL;
```

## Type Updates

### Updated Types (src/types/index.ts)
- Added `expense_time: string | null` to expenses Row, Insert, and Update types
- Added `expense_time?: string | null` to CreateExpenseData type

### Updated Validation (src/lib/validations/expenses.ts)
```typescript
expense_time: z.string()
  .regex(/^\d{2}:\d{2}$/, 'Время должно быть в формате HH:MM')
  .refine((time) => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
  }, 'Неверное время')
  .nullable()
  .optional()
```

## Parser Updates

### New Function: parseDateAndTime()
```typescript
export function parseDateAndTime(dateStr: string): { date: string; time: string | null } {
  // Supports formats:
  // - DD.MM.YYYY HH:MM (06.01.2025 12:02)
  // - DD.MM.YYYY H:MM (06.01.2025 9:30)
  // - D.M.YYYY HH:MM (6.1.2025 12:02)
  // - D.M.YYYY H:MM (6.1.2025 9:30)
  
  // Returns: { date: "2025-01-06", time: "12:02" }
  // Or: { date: "2025-01-06", time: null } if no time found
}
```

### Backward Compatibility
- Original `parseDate()` function preserved for compatibility
- `parseDateAndTime()` falls back to `parseDate()` if no time found

## Server Action Updates

### Updated createExpense() and createBulkExpenses()
```typescript
// Added expense_time field to database inserts
{
  user_id: user.id,
  amount: validatedData.amount,
  description: validatedData.description || null,
  notes: validatedData.notes || null,
  category_id: finalCategoryId || null,
  expense_date: validatedData.expense_date,
  expense_time: validatedData.expense_time || null, // NEW FIELD
  input_method: validatedData.input_method,
  // ... other fields
}
```

## Component Updates Needed

### BulkExpenseInput.tsx
```typescript
// NEEDS UPDATE: Replace parseDate with parseDateAndTime
case 'expense_date':
  const dateTimeResult = parseDateAndTime(cellValue)
  expenseData.expense_date = dateTimeResult.date
  expenseData.expense_time = dateTimeResult.time
  break

// NEEDS UPDATE: Add expense_time to newExpenses.push()
newExpenses.push({
  amount: expenseData.amount,
  description: expenseData.description,
  notes: expenseData.notes || '',
  category_id: '',
  expense_date: expenseData.expense_date || getCurrentDateISO(),
  expense_time: expenseData.expense_time || null, // NEW FIELD
  tempId: expenseData.tempId!
})
```

### BulkExpenseRowData Type
```typescript
// NEEDS UPDATE: Add expense_time to BulkExpenseRowData
export type BulkExpenseRowData = {
  amount: number
  description: string
  notes: string
  category_id: string
  expense_date: string
  expense_time?: string | null // NEW FIELD
  tempId?: string
}
```

## UI Display Updates Needed

### Expense List Components
- ExpensesPageContent.tsx - show time next to date
- ExpenseEditModal.tsx - allow editing time
- BulkExpenseTable.tsx - display time in preview

### Display Format Examples
```typescript
// Date only: "06.01.2025"
// Date with time: "06.01.2025 12:02"

const formatExpenseDateTime = (date: string, time: string | null) => {
  const formattedDate = new Date(date).toLocaleDateString('ru-RU')
  return time ? `${formattedDate} ${time}` : formattedDate
}
```

## Benefits

### For Users
- **More detailed records** - exact time of transactions from bank statements
- **Better tracking** - can see when expenses occurred during the day
- **Preserved data** - no loss of information from original bank data

### For Developers
- **Backward compatible** - existing functionality unchanged
- **Optional field** - doesn't break existing records
- **Flexible display** - can show/hide time as needed

## Migration Steps

1. ✅ Run database migration
2. ✅ Update types and validation
3. ✅ Update server actions
4. ✅ Update parsers
5. 🔄 Update BulkExpenseInput component (in progress)
6. ⏳ Update UI components to display time
7. ⏳ Update forms to allow time input
8. ⏳ Test with real bank statement data

## Testing

### Test Cases
1. **Date only**: "06.01.2025" → date: "2025-01-06", time: null
2. **Date with time**: "06.01.2025 12:02" → date: "2025-01-06", time: "12:02"
3. **Single digit hour**: "06.01.2025 9:30" → date: "2025-01-06", time: "09:30"
4. **No leading zeros**: "6.1.2025 9:30" → date: "2025-01-06", time: "09:30"

### Expected Behavior
- Existing expenses without time: display date only
- New expenses with time: display "date time"
- Bank statement imports: automatically extract and save time
- Manual entry: time field optional