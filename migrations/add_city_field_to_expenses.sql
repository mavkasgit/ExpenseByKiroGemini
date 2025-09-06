-- Добавление поля города в таблицу expenses
-- Дата: 2025-01-15

-- Добавляем поле city
ALTER TABLE expenses 
ADD COLUMN city VARCHAR(100);

-- Добавляем комментарий
COMMENT ON COLUMN expenses.city IS 'Город, извлеченный из описания транзакции';

-- Создаем индекс для поиска по городу
CREATE INDEX idx_expenses_city ON expenses(city) WHERE city IS NOT NULL;

-- Создаем индекс для комбинированного поиска пользователь + город
CREATE INDEX idx_expenses_user_city ON expenses(user_id, city) WHERE city IS NOT NULL;