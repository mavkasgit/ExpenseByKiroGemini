# Отладка проблемы с вставкой данных

## Проблема
После Ctrl+V данные не отображаются сразу в модальном окне настройки столбцов.

## Добавленная отладка

### В BulkExpenseInput.tsx:
```javascript
console.log('BulkExpenseInput: Setting pastedData', parsedData)
```

### В ColumnMappingModal.tsx:
```javascript
console.log('ColumnMappingModal: sampleData changed', sampleData)
console.log('ColumnMappingModal: columnCount', columnCount)
```

## Как тестировать:

1. **Откройте DevTools** (F12)
2. **Перейдите на страницу** `/expenses/bulk`
3. **Скопируйте тестовые данные:**
   ```
   100.50	Пицца	2024-01-15	Еда
   50.00	Автобус	2024-01-15	Транспорт
   1200.00	Интернет	2024-01-14	Коммунальные
   ```
4. **Вставьте данные** (Ctrl+V) в область массового ввода
5. **Проверьте консоль** - должны появиться логи
6. **Проверьте модальное окно** - должны отобразиться данные

## Ожидаемые логи:
```
BulkExpenseInput: Setting pastedData [Array with 3 rows]
ColumnMappingModal: sampleData changed [Array with 3 rows]
ColumnMappingModal: columnCount 4
```

## Возможные причины проблемы:

1. **Данные не парсятся** - проверить формат вставляемых данных
2. **useEffect не срабатывает** - проверить зависимости
3. **Состояние не обновляется** - проверить setState
4. **Модальное окно не открывается** - проверить isColumnMappingOpen

## Исправления:

✅ Добавлен `useEffect` для обновления состояния при изменении `sampleData`
✅ Добавлена проверка на пустые данные
✅ Исправлена инициализация состояния
✅ Добавлена отладочная информация

После тестирования нужно убрать console.log из продакшн кода.