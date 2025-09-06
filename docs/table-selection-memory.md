# Table Selection Memory Feature

## Overview

Добавлена функциональность запоминания выбора таблицы в TableSelectionModal для HTML банковских выписок. Теперь система автоматически использует ранее выбранную таблицу при повторной загрузке файлов.

## Key Features

### 1. Automatic Table Selection
- При первой загрузке HTML файла пользователь выбирает нужную таблицу
- Выбор сохраняется в localStorage
- При следующих загрузках система автоматически использует сохраненную таблицу
- Всегда есть возможность выбрать другую таблицу

### 2. Smart Fallback Logic
```typescript
// Логика выбора таблицы
if (analysis.tables.length === 1) {
  // Одна таблица - используем сразу
  await handleTableSelection(0)
} else if (savedTableIndex !== null && savedTableIndex < analysis.tables.length) {
  // Есть сохраненный индекс и он валиден - используем автоматически
  await handleTableSelection(savedTableIndex)
} else {
  // Показываем выбор таблицы
  setShowTableSelection(true)
}
```

### 3. Visual Indicators
- В TableSelectionModal показывается подсказка о автоматическом выборе
- Кнопка "Настройка столбцов" показывает индикатор (●) если есть сохраненные настройки
- Сохраненная таблица предварительно выбрана в модальном окне

## Implementation Details

### Storage Keys
```typescript
// localStorage keys
'bulkExpenseTableIndex' // Сохраненный индекс таблицы
'bulkExpenseColumnMapping' // Сохраненные настройки столбцов (уже было)
```

### New Functions
```typescript
// Загрузка сохраненного индекса
const loadSavedTableIndex = () => {
  const saved = localStorage.getItem('bulkExpenseTableIndex')
  return saved ? parseInt(saved, 10) : null
}

// Сохранение индекса
const saveTableIndex = (tableIndex: number) => {
  localStorage.setItem('bulkExpenseTableIndex', tableIndex.toString())
  setSavedTableIndex(tableIndex)
}
```

### Component Updates

#### BulkExpenseInput.tsx
- Добавлено состояние `savedTableIndex`
- Функции `loadSavedTableIndex` и `saveTableIndex`
- Автоматический выбор таблицы при загрузке файла
- Передача `savedTableIndex` в TableSelectionModal

#### TableSelectionModal.tsx
- Новый пропс `savedTableIndex?: number | null`
- Автоматический выбор сохраненной таблицы при открытии
- Визуальная подсказка о автоматическом выборе

## User Experience

### First Time Usage
1. Пользователь загружает HTML файл с несколькими таблицами
2. Открывается TableSelectionModal со всеми найденными таблицами
3. Пользователь выбирает нужную таблицу (например, "Детальная информация по операциям")
4. Выбор сохраняется автоматически

### Subsequent Usage
1. Пользователь загружает другой HTML файл
2. Система автоматически использует ранее выбранную таблицу
3. Если таблица найдена - сразу переходит к настройке столбцов
4. Если таблица не найдена - показывает выбор с предварительно выбранной опцией

### Manual Override
1. Если нужно выбрать другую таблицу, пользователь может:
   - Загрузить файл с одной таблицей (сбросит настройки)
   - Выбрать другую таблицу в модальном окне (обновит настройки)

## Benefits

### For Users
- **Faster workflow** - нет необходимости каждый раз выбирать таблицу
- **Consistent experience** - одинаковое поведение для похожих файлов
- **Flexibility** - всегда можно изменить выбор

### For Developers
- **Consistent pattern** - использует тот же подход что и column mapping
- **Maintainable code** - четкое разделение ответственности
- **Extensible** - легко добавить дополнительные настройки

## Technical Notes

### Validation
- Проверка валидности сохраненного индекса перед использованием
- Graceful fallback если индекс больше количества таблиц
- Обработка случаев когда localStorage недоступен

### Performance
- Минимальное влияние на производительность
- Настройки загружаются только при инициализации компонента
- Сохранение происходит только при изменении выбора

### Browser Compatibility
- Использует localStorage (поддерживается всеми современными браузерами)
- Graceful degradation если localStorage недоступен
- Не влияет на функциональность при отключенном JavaScript

## Future Enhancements

1. **File-specific memory** - запоминание выбора для конкретных типов файлов
2. **Smart suggestions** - предложение таблиц на основе содержимого
3. **Bulk settings management** - централизованное управление всеми настройками
4. **Export/import settings** - возможность экспорта настроек для других устройств