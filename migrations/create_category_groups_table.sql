-- Создание таблицы для групп категорий
CREATE TABLE IF NOT EXISTS category_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(100),
    color VARCHAR(7), -- Hex цвет, например #FF5733
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов
CREATE INDEX IF NOT EXISTS idx_category_groups_user_id ON category_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_category_groups_name ON category_groups(user_id, name);
CREATE INDEX IF NOT EXISTS idx_category_groups_sort_order ON category_groups(user_id, sort_order);

-- Добавление уникального ограничения на название группы для каждого пользователя
ALTER TABLE category_groups ADD CONSTRAINT unique_group_name_per_user UNIQUE (user_id, name);

-- Обновление поля group_name в таблице categories для связи с новой таблицей
-- Пока оставляем как есть для обратной совместимости, позже можно будет добавить FK

-- Создание функции для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_category_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создание триггера для автоматического обновления updated_at
CREATE TRIGGER trigger_update_category_groups_updated_at
    BEFORE UPDATE ON category_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_category_groups_updated_at();

-- Включение RLS (Row Level Security)
ALTER TABLE category_groups ENABLE ROW LEVEL SECURITY;

-- Создание политик RLS
CREATE POLICY "Users can view their own category groups" ON category_groups
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own category groups" ON category_groups
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own category groups" ON category_groups
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own category groups" ON category_groups
    FOR DELETE USING (auth.uid() = user_id);

-- Создание стандартных групп для существующих пользователей
INSERT INTO category_groups (name, icon, color, sort_order, user_id)
SELECT DISTINCT 
    'Основные' as name,
    'shopping-bag' as icon,
    '#6366f1' as color,
    1 as sort_order,
    user_id
FROM categories 
WHERE user_id IS NOT NULL
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO category_groups (name, icon, color, sort_order, user_id)
SELECT DISTINCT 
    'Транспорт' as name,
    'car' as icon,
    '#3b82f6' as color,
    2 as sort_order,
    user_id
FROM categories 
WHERE user_id IS NOT NULL
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO category_groups (name, icon, color, sort_order, user_id)
SELECT DISTINCT 
    'Еда и напитки' as name,
    'food' as icon,
    '#f59e0b' as color,
    3 as sort_order,
    user_id
FROM categories 
WHERE user_id IS NOT NULL
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO category_groups (name, icon, color, sort_order, user_id)
SELECT DISTINCT 
    'Развлечения' as name,
    'entertainment' as icon,
    '#ec4899' as color,
    4 as sort_order,
    user_id
FROM categories 
WHERE user_id IS NOT NULL
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO category_groups (name, icon, color, sort_order, user_id)
SELECT DISTINCT 
    'Здоровье' as name,
    'health' as icon,
    '#ef4444' as color,
    5 as sort_order,
    user_id
FROM categories 
WHERE user_id IS NOT NULL
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO category_groups (name, icon, color, sort_order, user_id)
SELECT DISTINCT 
    'Дом и быт' as name,
    'home' as icon,
    '#10b981' as color,
    6 as sort_order,
    user_id
FROM categories 
WHERE user_id IS NOT NULL
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO category_groups (name, icon, color, sort_order, user_id)
SELECT DISTINCT 
    'Образование' as name,
    'education' as icon,
    '#8b5cf6' as color,
    7 as sort_order,
    user_id
FROM categories 
WHERE user_id IS NOT NULL
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO category_groups (name, icon, color, sort_order, user_id)
SELECT DISTINCT 
    'Путешествия' as name,
    'travel' as icon,
    '#06b6d4' as color,
    8 as sort_order,
    user_id
FROM categories 
WHERE user_id IS NOT NULL
ON CONFLICT (user_id, name) DO NOTHING;