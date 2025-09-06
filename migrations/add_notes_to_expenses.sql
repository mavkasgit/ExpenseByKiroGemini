-- Добавляем поле notes в таблицу expenses
ALTER TABLE expenses 
ADD COLUMN notes TEXT;

-- Добавляем комментарий к полю
COMMENT ON COLUMN expenses.notes IS 'Дополнительные примечания к расходу';