# Unified Bulk Input with Bank Statements

## Overview

Интегрирована функциональность загрузки банковских выписок в компонент массового ввода расходов. Теперь пользователи могут использовать одну форму для:

1. Ручного ввода расходов
2. Вставки данных из буфера обмена
3. Загрузки CSV файлов
4. Загрузки HTML банковских выписок с выбором таблицы

## Key Features

### 1. Unified File Upload
- Поддержка всех форматов файлов: CSV, HTML, XLSX, OFX и другие
- Автоматическое определение типа файла по расширению
- Единый интерфейс для всех типов загрузки

### 2. HTML Bank Statement Processing
- Автоматический анализ HTML файлов для поиска всех таблиц
- Интерактивный выбор нужной таблицы с предпросмотром
- Поддержка сложных HTML структур банковских выписок

### 3. Table Selection Modal
- Показывает все найденные таблицы с описанием
- Предпросмотр содержимого каждой таблицы
- Информация о количестве строк и столбцов
- Определение наличия заголовков

### 4. Consistent Data Flow
- После выбора таблицы данные попадают в тот же поток обработки
- Используется существующий ColumnMappingModal
- Те же настройки сохранения и валидации
- Единообразная обработка ошибок

## Implementation Details

### Components Modified

1. **BulkExpenseInput.tsx**
   - Добавлен импорт TableSelectionModal и bankStatementParsers
   - Новые состояния для управления выбором таблицы
   - Обновленная логика handleFileUpload для HTML файлов
   - Интеграция с analyzeHTML и parseBankStatementFile

2. **File Upload Logic**
   ```typescript
   // Для HTML файлов
   if (fileExtension === 'html' || fileExtension === 'htm') {
     const analysis = analyzeHTML(content)
     if (analysis.tables.length > 1) {
       setAvailableTables(analysis.tables)
       setShowTableSelection(true)
     } else {
       await handleTableSelection(0)
     }
   }
   ```

3. **Table Selection Handler**
   ```typescript
   const handleTableSelection = useCallback(async (tableIndex: number) => {
     const parsed = await parseBankStatementFile(new File([fileContent], fileName), tableIndex)
     const parsedData = [parsed.headers, ...parsed.rows]
     setPastedData(parsedData)
     setIsColumnMappingOpen(true)
   }, [fileContent, fileName, showToast])
   ```

### UI Changes

1. **Updated Title**: "Массовый ввод и банковские выписки"
2. **File Accept**: Changed from `.csv,.txt` to `*/*`
3. **Help Text**: Updated to mention HTML bank statements
4. **Modal Integration**: Added TableSelectionModal with proper state management

## User Experience

### Workflow for HTML Bank Statements

1. User clicks "Загрузить файл" and selects HTML file
2. System analyzes HTML and finds all tables
3. If multiple tables found, shows TableSelectionModal
4. User selects appropriate table with transaction data
5. System parses selected table and shows ColumnMappingModal
6. User maps columns to expense fields (same as CSV workflow)
7. Data is processed and added to expense table
8. User can review and save expenses

### Benefits

- **Single Interface**: No need to switch between different forms
- **Consistent Experience**: Same column mapping and settings for all data sources
- **Smart Detection**: Automatic table analysis and description
- **Memory**: Settings are saved and reused across sessions
- **Flexibility**: Supports any file format through unified parser

## Technical Architecture

```
File Upload
    ↓
File Type Detection
    ↓
HTML? → analyzeHTML() → TableSelectionModal → parseBankStatementFile()
    ↓                                              ↓
CSV/Other? → Direct parsing                        ↓
    ↓                                              ↓
    └─────────────→ ColumnMappingModal ←──────────┘
                           ↓
                   BulkExpenseTable
                           ↓
                   createBulkExpenses()
```

## Error Handling

- File parsing errors are caught and shown as toast messages
- Empty tables are detected and reported
- Invalid HTML structures are handled gracefully
- Network errors during file processing are managed

## Future Enhancements

1. **Drag & Drop**: Add drag and drop support for files
2. **File Preview**: Show file content preview before processing
3. **Batch Processing**: Support multiple file uploads
4. **Format Detection**: Better automatic format detection
5. **Progress Indicators**: Show progress for large file processing

## Migration Notes

- Existing CSV functionality remains unchanged
- All existing settings and preferences are preserved
- No breaking changes to existing workflows
- Bank statement upload page can be deprecated in favor of unified interface