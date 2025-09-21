'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/hooks/useToast'
import { BulkExpenseTable } from './BulkExpenseTable'
import { BulkExpensePreview } from './BulkExpensePreview'
import { ColumnMappingModal } from './ColumnMappingModal'

import { createBulkExpenses } from '@/lib/actions/expenses'
import { getCurrentDateISO } from '@/lib/utils/dateUtils'
import { parseBankStatementFile, analyzeHTML, parseDateAndTime } from '@/lib/utils/bankStatementParsers'
import { extractCityFromDescription } from '@/lib/utils/cityParser'
import type { Category, CreateExpenseData, ColumnMapping } from '@/types'
import type { BulkExpenseRowData } from '@/lib/validations/expenses'
import type { TableInfo } from '@/lib/utils/bankStatementParsers'
import { useCitySynonyms } from '@/hooks/useCitySynonyms'

interface BulkExpenseInputProps {
  categories: Category[]
}

export function BulkExpenseInput({ categories }: BulkExpenseInputProps) {
  const [expenses, setExpenses] = useState<BulkExpenseRowData[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isColumnMappingOpen, setIsColumnMappingOpen] = useState(false)
  const [pastedData, setPastedData] = useState<string[][]>([])
  const [autoRedirect, setAutoRedirect] = useState(false) // Изначально выключен
  const [savedColumnMapping, setSavedColumnMapping] = useState<ColumnMapping[] | null>(null)
  const [isEditingColumnMapping, setIsEditingColumnMapping] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [showTableSelection, setShowTableSelection] = useState(false)
  const [availableTables, setAvailableTables] = useState<TableInfo[]>([])
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [savedTableIndex, setSavedTableIndex] = useState<number | null>(null)
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  useCitySynonyms()

  // Загрузка сохраненной схемы столбцов при инициализации
  const loadSavedColumnMapping = useCallback(() => {
    try {
      const saved = localStorage.getItem('bulkExpenseColumnMapping')
      if (saved) {
        const mapping = JSON.parse(saved)
        setSavedColumnMapping(mapping)
        return mapping
      }
    } catch (error) {
      console.warn('Ошибка загрузки сохраненной схемы столбцов:', error)
    }
    return null
  }, [])

  // Сохранение схемы столбцов
  const saveColumnMapping = useCallback((mapping: ColumnMapping[]) => {
    try {
      localStorage.setItem('bulkExpenseColumnMapping', JSON.stringify(mapping))
      setSavedColumnMapping(mapping)
    } catch (error) {
      console.warn('Ошибка сохранения схемы столбцов:', error)
    }
  }, [])

  // Загрузка сохраненного индекса таблицы
  const loadSavedTableIndex = useCallback(() => {
    try {
      const saved = localStorage.getItem('bulkExpenseTableIndex')
      if (saved) {
        const tableIndex = parseInt(saved, 10)
        setSavedTableIndex(tableIndex)
        return tableIndex
      }
    } catch (error) {
      console.warn('Ошибка загрузки сохраненного индекса таблицы:', error)
    }
    return null
  }, [])

  // Сохранение индекса таблицы
  const saveTableIndex = useCallback((tableIndex: number) => {
    try {
      localStorage.setItem('bulkExpenseTableIndex', tableIndex.toString())
      setSavedTableIndex(tableIndex)
    } catch (error) {
      console.warn('Ошибка сохранения индекса таблицы:', error)
    }
  }, [])

  // Загружаем сохраненные настройки при первом рендере
  useEffect(() => {
    setIsMounted(true)
    loadSavedColumnMapping()
    loadSavedTableIndex()
  }, [loadSavedColumnMapping, loadSavedTableIndex])

  // Добавить новую строку
  const addRow = useCallback(() => {
    const newRow: BulkExpenseRowData = {
      amount: 0,
      description: '',
      notes: '',
      category_id: '',
      expense_date: getCurrentDateISO(),
      expense_time: '',
      city: '',
      tempId: crypto.randomUUID()
    }
    setExpenses(prev => [...prev, newRow])
  }, [])

  // Удалить строку
  const removeRow = useCallback((tempId: string) => {
    setExpenses(prev => prev.filter(expense => expense.tempId !== tempId))
    setValidationErrors(prev => {
      const newErrors = { ...prev }
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(`${tempId}-`)) {
          delete newErrors[key]
        }
      })
      return newErrors
    })
  }, [])

  // Обновить строку
  const updateRow = useCallback((tempId: string, field: keyof BulkExpenseRowData, value: any) => {
    setExpenses(prev => prev.map(expense =>
      expense.tempId === tempId
        ? { ...expense, [field]: value }
        : expense
    ))

    // Очистить ошибку валидации для этого поля
    const errorKey = `${tempId}-${field}`
    if (validationErrors[errorKey]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[errorKey]
        return newErrors
      })
    }
  }, [validationErrors])

  // Валидация данных
  const validateExpenses = useCallback(() => {
    const errors: Record<string, string> = {}
    let hasErrors = false

    expenses.forEach((expense, index) => {
      const prefix = expense.tempId || index.toString()

      if (!expense.amount || expense.amount <= 0) {
        errors[`${prefix}-amount`] = 'Сумма должна быть больше 0'
        hasErrors = true
      }

      if (!expense.description?.trim()) {
        errors[`${prefix}-description`] = 'Описание обязательно'
        hasErrors = true
      }

      if (!expense.expense_date) {
        errors[`${prefix}-expense_date`] = 'Дата обязательна'
        hasErrors = true
      }

      if (expense.expense_time && expense.expense_time.trim()) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
        if (!timeRegex.test(expense.expense_time.trim())) {
          errors[`${prefix}-expense_time`] = 'Время должно быть в формате ЧЧ:ММ'
          hasErrors = true
        }
      }
    })

    setValidationErrors(errors)
    return !hasErrors
  }, [expenses])

  // Обработка вставки из буфера обмена
  const handlePaste = useCallback(async (event: React.ClipboardEvent) => {
    event.preventDefault()

    try {
      const pastedText = event.clipboardData.getData('text')
      const lines = pastedText.split('\n').filter(line => line.trim())

      if (lines.length === 0) return

      // Парсим данные в двумерный массив
      const parsedData = lines.map(line =>
        line.split('\t').map(cell => cell.trim()) // Разделение по табуляции (Excel/Google Sheets)
      )

      // Если данных больше одного столбца, всегда показываем модальное окно
      if (parsedData[0] && parsedData[0].length > 1) {
        setPastedData(parsedData)
        setIsEditingColumnMapping(false) // Это не режим редактирования
        setIsColumnMappingOpen(true)
      } else {
        // Если только один столбец, обрабатываем как описания
        const newExpenses: BulkExpenseRowData[] = []

        parsedData.forEach(row => {
          if (row[0]) {
            newExpenses.push({
              amount: 0,
              description: row[0],
              notes: '',
              category_id: '',
              expense_date: getCurrentDateISO(),
              tempId: crypto.randomUUID()
            })
          }
        })

        if (newExpenses.length > 0) {
          setExpenses(prev => [...prev, ...newExpenses])
          showToast('Данные успешно вставлены из буфера обмена', 'success')
        }
      }
    } catch (error) {
      showToast('Ошибка при вставке данных', 'error')
    }
  }, [showToast])



  // Применение настроек столбцов
  const handleColumnMappingApply = useCallback((mapping: ColumnMapping[]) => {
    try {
      // Сохраняем схему столбцов для будущего использования
      saveColumnMapping(mapping)

      // В режиме редактирования только сохраняем настройки
      if (isEditingColumnMapping) {
        showToast('Настройки столбцов сохранены', 'success')
        return
      }

      const newExpenses: BulkExpenseRowData[] = []

      pastedData.forEach(row => {
        const expenseData: Partial<BulkExpenseRowData> = {
          tempId: crypto.randomUUID()
        }

        // Применяем маппинг столбцов
        mapping.forEach((column, index) => {
          if (!column.enabled || column.targetField === 'skip') return

          const cellValue = row[index]?.trim() || ''
          if (!cellValue) return

          switch (column.targetField) {
            case 'amount':
              const amount = parseFloat(cellValue.replace(/[^\d.,]/g, '').replace(',', '.'))
              if (!isNaN(amount)) {
                expenseData.amount = amount
              }
              break
            case 'description':
              expenseData.description = cellValue
              break
            case 'expense_date':
              const dateTimeResult1 = parseDateAndTime(cellValue)
              expenseData.expense_date = dateTimeResult1.date
              expenseData.expense_time = dateTimeResult1.time
              break
            case 'notes':
              expenseData.notes = cellValue
              break
          }
        })

        // Добавляем только если есть сумма и описание
        if (expenseData.amount && expenseData.description) {
          // Извлекаем город из описания и очищаем описание
          let cleanDescription = expenseData.description
          let notes = expenseData.notes || ''
          
          const cityParseResult = extractCityFromDescription(expenseData.description)
          if (cityParseResult.confidence > 0.6) {
            cleanDescription = cityParseResult.cleanDescription
            if (cityParseResult.city) {
              const cityLabel = cityParseResult.displayCity || cityParseResult.city
              const cityNote = `Город: ${cityLabel}`
              notes = notes ? `${notes}\n${cityNote}` : cityNote
            }
          }

          newExpenses.push({
            amount: expenseData.amount,
            description: cleanDescription,
            notes,
            category_id: '',
            expense_date: expenseData.expense_date || getCurrentDateISO(),
            expense_time: expenseData.expense_time || null,
            tempId: expenseData.tempId!
          })
        }
      })

      if (newExpenses.length > 0) {
        setExpenses(prev => [...prev, ...newExpenses])
        showToast(`Добавлено ${newExpenses.length} записей с настроенным маппингом столбцов`, 'success')
      } else {
        showToast('Не удалось обработать данные с текущими настройками столбцов', 'error')
      }

      // Очищаем временные данные
      setPastedData([])
    } catch (error) {
      showToast('Ошибка при обработке данных', 'error')
    }
  }, [pastedData, showToast, saveColumnMapping, isEditingColumnMapping])

  // Применение настроек столбцов и прямое сохранение
  const handleColumnMappingApplyAndSave = useCallback(async (mapping: ColumnMapping[]) => {
    try {
      // Сохраняем схему столбцов для будущего использования
      saveColumnMapping(mapping)

      const newExpenses: BulkExpenseRowData[] = []

      pastedData.forEach(row => {
        const expenseData: Partial<BulkExpenseRowData> = {
          tempId: crypto.randomUUID()
        }

        // Применяем маппинг столбцов
        mapping.forEach((column, index) => {
          if (!column.enabled || column.targetField === 'skip') return

          const cellValue = row[index]?.trim() || ''
          if (!cellValue) return

          switch (column.targetField) {
            case 'amount':
              const amount = parseFloat(cellValue.replace(/[^\d.,]/g, '').replace(',', '.'))
              if (!isNaN(amount)) {
                expenseData.amount = amount
              }
              break
            case 'description':
              expenseData.description = cellValue
              break
            case 'expense_date':
              const dateTimeResult2 = parseDateAndTime(cellValue)
              expenseData.expense_date = dateTimeResult2.date
              expenseData.expense_time = dateTimeResult2.time
              break
            case 'notes':
              expenseData.notes = cellValue
              break
          }
        })

        // Добавляем только если есть сумма и описание
        if (expenseData.amount && expenseData.description) {
          // Извлекаем город из описания и очищаем описание
          let cleanDescription = expenseData.description
          let notes = expenseData.notes || ''
          
          const cityParseResult = extractCityFromDescription(expenseData.description)
          if (cityParseResult.confidence > 0.6) {
            cleanDescription = cityParseResult.cleanDescription
            if (cityParseResult.city) {
              const cityLabel = cityParseResult.displayCity || cityParseResult.city
              const cityNote = `Город: ${cityLabel}`
              notes = notes ? `${notes}\n${cityNote}` : cityNote
            }
          }

          newExpenses.push({
            amount: expenseData.amount,
            description: cleanDescription,
            notes,
            category_id: '',
            expense_date: expenseData.expense_date || getCurrentDateISO(),
            expense_time: expenseData.expense_time || null,
            tempId: expenseData.tempId!
          })
        }
      })

      if (newExpenses.length === 0) {
        showToast('Не удалось обработать данные с текущими настройками столбцов', 'error')
        return
      }

      // Сразу сохраняем расходы
      const expensesToCreate: CreateExpenseData[] = newExpenses.map(expense => ({
        amount: expense.amount,
        description: expense.description,
        notes: expense.notes,
        category_id: expense.category_id || undefined,
        expense_date: expense.expense_date,
        expense_time: expense.expense_time || null,
        input_method: 'bulk_table' as const
      }))

      const result = await createBulkExpenses(expensesToCreate)

      if (result.error) {
        showToast(result.error, 'error')
        return
      }

      if (result.success && result.stats) {
        const { success, failed, uncategorized, total } = result.stats

        let message = `Создано ${success} из ${total} расходов`
        if (failed > 0) {
          message += `, ${failed} с ошибками`
        }
        if (uncategorized > 0) {
          message += `, ${uncategorized} без категории`
        }

        showToast(message, success > 0 ? 'success' : 'error')

        // Очищаем данные при успехе
        if (success > 0) {
          setPastedData([])

          // Перенаправляем на страницу расходов если включен автопереход
          if (autoRedirect) {
            router.push('/expenses')
          }
        }
      }

    } catch (error) {
      showToast('Ошибка при сохранении расходов', 'error')
    }
  }, [pastedData, showToast, saveColumnMapping, autoRedirect, router])

  // Обработка выбора таблицы из HTML файла
  const handleTableSelection = useCallback(async (tableIndex: number) => {
    if (!fileContent || !fileName) return
    
    setShowTableSelection(false)
    
    // Сохраняем выбранный индекс таблицы
    saveTableIndex(tableIndex)
    
    try {
      const parsed = await parseBankStatementFile(new File([fileContent], fileName), tableIndex)
      
      if (parsed.totalRows === 0) {
        showToast('Выбранная таблица не содержит данных', 'error')
        return
      }

      // Преобразуем данные в формат для ColumnMappingModal
      const parsedData = [parsed.headers, ...parsed.rows]
      setPastedData(parsedData)
      setIsEditingColumnMapping(false)
      setIsColumnMappingOpen(true)
      
      showToast(`Загружено ${parsed.totalRows} записей из таблицы`, 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Ошибка обработки таблицы', 'error')
    }
  }, [fileContent, fileName, showToast, saveTableIndex])

  // Загрузка из файла
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      const content = await file.text()
      
      // Сохраняем информацию о файле
      setFileName(file.name)
      setFileContent(content)

      // Для HTML файлов показываем выбор таблицы
      if (fileExtension === 'html' || fileExtension === 'htm') {
        try {
          const analysis = analyzeHTML(content)
          
          if (analysis.tables.length === 0) {
            showToast('В HTML файле не найдено таблиц с данными', 'error')
            return
          }
          
          if (analysis.tables.length === 1) {
            // Если только одна таблица, используем её сразу
            await handleTableSelection(0)
          } else {
            // Проверяем, есть ли сохраненный индекс таблицы и подходит ли он
            if (savedTableIndex !== null && 
                savedTableIndex >= 0 && 
                savedTableIndex < analysis.tables.length) {
              // Используем сохраненную таблицу автоматически
              await handleTableSelection(savedTableIndex)
            } else {
              // Показываем выбор таблицы
              setAvailableTables(analysis.tables)
              setShowTableSelection(true)
            }
          }
        } catch (error) {
          showToast(error instanceof Error ? error.message : 'Ошибка анализа HTML файла', 'error')
          return
        }
      } else {
        // Для других форматов используем существующую логику
        const lines = content.split('\n').filter(line => line.trim())

        if (lines.length === 0) {
          showToast('Файл пуст', 'error')
          return
        }

        // Пропускаем первую строку если она похожа на заголовок
        const startIndex = lines[0]?.toLowerCase().includes('сумма') ||
          lines[0]?.toLowerCase().includes('amount') ? 1 : 0

        // Парсим данные в двумерный массив
        const parsedData = lines.slice(startIndex).map(line =>
          line.split(/[,;\t]/).map(cell => cell.trim()) // Разделители: запятая, точка с запятой, табуляция
        )

        // Если данных больше одного столбца, показываем модальное окно настройки
        if (parsedData[0] && parsedData[0].length > 1) {
          setPastedData(parsedData)
          setIsEditingColumnMapping(false)
          setIsColumnMappingOpen(true)
        } else {
          // Если только один столбец, обрабатываем как описания
          const newExpenses: BulkExpenseRowData[] = []

          parsedData.forEach(row => {
            if (row[0]) {
              newExpenses.push({
                amount: 0,
                description: row[0],
                notes: '',
                category_id: '',
                expense_date: getCurrentDateISO(),
                tempId: crypto.randomUUID()
              })
            }
          })

          if (newExpenses.length > 0) {
            setExpenses(prev => [...prev, ...newExpenses])
            showToast(`Загружено ${newExpenses.length} записей из файла`, 'success')
          }
        }
      }
    } catch (error) {
      showToast('Ошибка при загрузке файла', 'error')
    } finally {
      // Очищаем input для возможности повторной загрузки того же файла
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [showToast, handleTableSelection, savedTableIndex])

  // Прямое сохранение без предпросмотра
  const handleDirectSave = useCallback(async () => {
    if (expenses.length === 0) {
      showToast('Добавьте хотя бы один расход', 'error')
      return
    }

    if (!validateExpenses()) {
      showToast('Исправьте ошибки в данных', 'error')
      return
    }

    setIsSubmitting(true)

    try {
      // Преобразуем данные для отправки
      const expensesToCreate: CreateExpenseData[] = expenses.map(expense => ({
        amount: expense.amount,
        description: expense.description,
        notes: expense.notes,
        category_id: expense.category_id || undefined,
        expense_date: expense.expense_date,
        expense_time: expense.expense_time || null,
        input_method: 'bulk_table' as const
      }))

      const result = await createBulkExpenses(expensesToCreate)

      if (result.error) {
        showToast(result.error, 'error')
        return
      }

      if (result.success && result.stats) {
        const { success, failed, uncategorized, total } = result.stats

        let message = `Создано ${success} из ${total} расходов`
        if (failed > 0) {
          message += `, ${failed} с ошибками`
        }
        if (uncategorized > 0) {
          message += `, ${uncategorized} без категории`
        }

        showToast(message, success > 0 ? 'success' : 'error')

        // Очищаем форму при успехе
        if (success > 0) {
          setExpenses([])

          // Перенаправляем на страницу расходов только если включен автопереход
          if (autoRedirect) {
            router.push('/expenses')
          }
        }
      }
    } catch (error) {
      showToast('Произошла ошибка при сохранении', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }, [expenses, validateExpenses, showToast, router, autoRedirect])

  // Очистить все данные
  const handleClear = useCallback(() => {
    setExpenses([])
    setValidationErrors({})
  }, [])

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex-1">
            Массовый ввод и банковские выписки
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            {/* Переключатель автоперехода */}
            <div
              className="flex items-center gap-2 cursor-pointer select-none"
              onClick={() => setAutoRedirect(!autoRedirect)}
            >
              <span className="text-sm text-gray-700">Автопереход</span>
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoRedirect ? 'bg-blue-600' : 'bg-gray-200'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoRedirect ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
            </div>

            <div className="h-6 w-px bg-gray-300"></div> {/* Разделитель */}
            <Button
              variant="outline"
              size="sm"
              onClick={addRow}
            >
              + Добавить строку
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              📁 Загрузить файл
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Проверяем, есть ли сохраненная схема
                const savedMapping = loadSavedColumnMapping()

                if (savedMapping && savedMapping.length > 0) {
                  // Создаем только заголовки столбцов на основе сохраненной схемы
                  const sampleData = [
                    savedMapping.map((_item: ColumnMapping, index: number) => `Столбец ${String.fromCharCode(65 + index)}`)
                  ]
                  setPastedData(sampleData)
                } else {
                  // Создаем стандартные заголовки столбцов
                  const sampleData = [
                    ['Столбец A', 'Столбец B', 'Столбец C', 'Столбец D']
                  ]
                  setPastedData(sampleData)
                }
                setIsEditingColumnMapping(true)
                setIsColumnMappingOpen(true)
              }}
              title="Настроить порядок столбцов для вставки данных"
            >
              ⚙️ Настройка столбцов <span className={`ml-1 text-xs ${isMounted && (savedColumnMapping || savedTableIndex !== null) ? 'opacity-100' : 'opacity-0'}`}>●</span>
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="*/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {expenses.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                >
                  🗑️ Очистить
                </Button>


                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleDirectSave}
                  disabled={isSubmitting}
                  className={isSubmitting ? 'animate-pulse' : ''}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Сохранение...
                    </span>
                  ) : (
                    '💾 Сохранить'
                  )}
                </Button>
              </>
            )}
          </div>
        </div>



        {expenses.length === 0 ? (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center"
            onPaste={handlePaste}
            tabIndex={0}
          >
            <div className="text-gray-500">
              <p className="text-lg mb-2">Нет данных для ввода</p>
              <p className="text-sm">
                Добавьте строку, загрузите файл или вставьте данные из буфера обмена
              </p>
            </div>
          </div>
        ) : (
          <BulkExpenseTable
            expenses={expenses}
            categories={categories}
            validationErrors={validationErrors}
            onUpdateRow={updateRow}
            onRemoveRow={removeRow}
            onPaste={handlePaste}
          />
        )}

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Как использовать:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Добавляйте строки кнопкой &quot;Добавить строку&quot;</li>
            <li>• Копируйте данные из Excel/Google Sheets и вставляйте (Ctrl+V)</li>
            <li>• Загружайте файлы любых форматов: CSV, HTML, XLSX, OFX и другие</li>
            <li>• Для HTML файлов (банковские выписки) система найдет все таблицы и предложит выбрать нужную</li>
            <li>• <strong>Выбор таблицы запоминается</strong> - при следующей загрузке будет использована та же таблица</li>
            <li>• Используйте &quot;Настройка столбцов&quot; для изменения порядка полей</li>
            <li>• Система автоматически определит категории по описанию</li>
          </ul>
        </div>
      </Card>

      {/* Модальное окно выбора таблицы */}
      <Modal
        isOpen={showTableSelection}
        onClose={() => {
          setShowTableSelection(false)
          setAvailableTables([])
          setFileContent(null)
          setFileName('')
        }}
        title="Выбор таблицы"
        size="xl"
      >
        {availableTables.length > 0 && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Найдено {availableTables.length} таблиц. Выберите таблицу для импорта:
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {availableTables.map((table, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    savedTableIndex === index 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handleTableSelection(index)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {table.description}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {table.rowCount} строк, {table.columnCount} столбцов
                      </p>
                    </div>
                    {savedTableIndex === index && (
                      <div className="text-blue-600 text-sm">
                        ✓ Использовалась ранее
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTableSelection(false)
                  setAvailableTables([])
                  setFileContent(null)
                  setFileName('')
                }}
              >
                Отмена
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Модальное окно настройки столбцов */}
      <ColumnMappingModal
        isOpen={isColumnMappingOpen}
        onClose={() => {
          setIsColumnMappingOpen(false)
          setPastedData([])
          setIsEditingColumnMapping(false)
        }}
        onApply={handleColumnMappingApply}
        onApplyAndSave={handleColumnMappingApplyAndSave}
        sampleData={pastedData}
        savedMapping={savedColumnMapping}
        isEditingMode={isEditingColumnMapping}
      />
    </div>
  )
}
