'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { ColumnMapping } from '@/types'

// Компонент подсказки
function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  return (
    <div className="relative group">
      {children}
      {/* Tooltip справа от элемента */}
      <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[10000] break-words shadow-lg" style={{maxWidth: '400px', width: 'max-content', minWidth: '200px'}}>
        {content}
        {/* Стрелка слева */}
        <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
      </div>
    </div>
  )
}

// ColumnMapping импортирован из @/types

interface FieldAssignment {
  field: 'amount' | 'description' | 'expense_date' | 'notes'
  assignedColumn: number | null
  required: boolean
}

interface ColumnMappingModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (mapping: ColumnMapping[]) => void
  onApplyAndSave?: (mapping: ColumnMapping[]) => void // Новый проп для прямого сохранения
  sampleData: string[][] // Первые несколько строк для предпросмотра
  savedMapping?: ColumnMapping[] | null // Сохраненная схема столбцов
  isEditingMode?: boolean // Режим редактирования сохраненной схемы
}

const FIELD_ICONS = {
  amount: '💰',
  description: '📝',
  expense_date: '📅',
  notes: '📋',
  skip: ''
}

const FIELD_LABELS = {
  amount: 'Сумма',
  description: 'Описание',
  expense_date: 'Дата',
  notes: 'Примечания',
  skip: 'Пропустить'
}

const FIELD_COLORS = {
  amount: 'bg-green-100 border-green-300 text-green-800',
  description: 'bg-blue-100 border-blue-300 text-blue-800',
  expense_date: 'bg-purple-100 border-purple-300 text-purple-800',
  notes: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  skip: 'bg-gray-100 border-gray-300 text-gray-600'
}

export function ColumnMappingModal({ 
  isOpen, 
  onClose, 
  onApply, 
  onApplyAndSave,
  sampleData,
  savedMapping,
  isEditingMode = false
}: ColumnMappingModalProps) {
  // Инициализируем порядок столбцов (только индексы)
  const [columnOrder, setColumnOrder] = useState<number[]>([])

  // Инициализируем назначения полей
  const [fieldAssignments, setFieldAssignments] = useState<FieldAssignment[]>([])

  // Обновляем состояние при изменении sampleData
  useEffect(() => {
    if (sampleData.length === 0) {
      setColumnOrder([])
      setFieldAssignments([])
      return
    }

    const columnCount = Math.max(...sampleData.map(row => row.length))
    
    // Обновляем порядок столбцов
    setColumnOrder(Array.from({ length: columnCount }, (_, index) => index))
    
    // Проверяем, есть ли сохраненная схема и подходит ли она
    if (savedMapping && savedMapping.length === columnCount) {
      // Применяем сохраненную схему
      const newFieldAssignments: FieldAssignment[] = [
        { field: 'amount' as const, assignedColumn: null, required: true },
        { field: 'description' as const, assignedColumn: null, required: true },
        { field: 'expense_date' as const, assignedColumn: null, required: false },
        { field: 'notes' as const, assignedColumn: null, required: false }
      ]
      
      // Восстанавливаем назначения из сохраненной схемы
      savedMapping.forEach((column, index) => {
        if (column.targetField !== 'skip') {
          const targetField = column.targetField as 'amount' | 'description' | 'expense_date' | 'notes'
          const fieldAssignment = newFieldAssignments.find(f => f.field === targetField)
          if (fieldAssignment) {
            fieldAssignment.assignedColumn = index as number
          }
        }
      })
      
      setFieldAssignments(newFieldAssignments)
    } else {
      // Обновляем назначения полей - изначально все неназначенные
      setFieldAssignments([
        { field: 'amount', assignedColumn: null, required: true },
        { field: 'description', assignedColumn: null, required: true },
        { field: 'expense_date', assignedColumn: null, required: false },
        { field: 'notes', assignedColumn: null, required: false }
      ])
    }
  }, [sampleData, savedMapping])

  // Назначение поля на столбец с предотвращением дублирования
  const assignFieldToColumn = useCallback((field: 'amount' | 'description' | 'expense_date' | 'notes', columnIndex: number | null) => {
    setFieldAssignments(prev => prev.map(assignment => {
      // Если назначаем новое поле на столбец, убираем старое назначение с этого столбца
      if (assignment.assignedColumn === columnIndex && assignment.field !== field) {
        return { ...assignment, assignedColumn: null }
      }
      // Назначаем новое поле
      if (assignment.field === field) {
        return { ...assignment, assignedColumn: columnIndex }
      }
      return assignment
    }))
  }, [])

  // Получаем назначенное поле для столбца
  const getAssignedField = useCallback((columnIndex: number) => {
    const assignment = fieldAssignments.find(f => f.assignedColumn === columnIndex)
    return assignment?.field || 'skip'
  }, [fieldAssignments])

  // Создание маппинга из текущих настроек
  const createMapping = useCallback(() => {
    // Преобразуем в старый формат для совместимости
    const mapping: ColumnMapping[] = columnOrder.map((originalIndex, newIndex) => ({
      sourceIndex: newIndex,
      targetField: 'skip' as const,
      enabled: true, // Все столбцы включены по умолчанию
      preview: sampleData[0]?.[originalIndex] || ''
    }))

    // Назначаем поля
    fieldAssignments.forEach(assignment => {
      if (assignment.assignedColumn !== null) {
        const orderIndex = columnOrder.indexOf(assignment.assignedColumn)
        if (orderIndex !== -1) {
          mapping[orderIndex].targetField = assignment.field
          mapping[orderIndex].enabled = true
        }
      }
    })

    // Отключаем столбцы, которые не назначены ни одному полю
    mapping.forEach(item => {
      if (item.targetField === 'skip') {
        item.enabled = false
      }
    })

    return mapping
  }, [columnOrder, fieldAssignments, sampleData])

  // Применение настроек для редактирования
  const handleApply = useCallback(() => {
    // В режиме редактирования не требуем обязательные поля
    if (!isEditingMode) {
      // Проверяем обязательные поля только при обработке данных
      const amountField = fieldAssignments.find(f => f.field === 'amount')
      const descriptionField = fieldAssignments.find(f => f.field === 'description')
      
      if (!amountField?.assignedColumn || !descriptionField?.assignedColumn) {
        // В обычном режиме требуем обязательные поля
        return
      }
    }

    const mapping = createMapping()
    onApply(mapping)
    onClose()
  }, [createMapping, onApply, onClose, isEditingMode, fieldAssignments])

  // Применение и прямое сохранение
  const handleApplyAndSave = useCallback(() => {
    // Проверяем обязательные поля
    const amountField = fieldAssignments.find(f => f.field === 'amount')
    const descriptionField = fieldAssignments.find(f => f.field === 'description')
    
    if (!amountField?.assignedColumn || !descriptionField?.assignedColumn) {
      return
    }

    const mapping = createMapping()
    if (onApplyAndSave) {
      onApplyAndSave(mapping)
    }
    onClose()
  }, [createMapping, onApplyAndSave, onClose, fieldAssignments])

  // Вычисляем предпросмотр данных в реальном времени
  const previewData = useMemo(() => {
    if (sampleData.length === 0) return []

    const amountField = fieldAssignments.find(f => f.field === 'amount')
    const descriptionField = fieldAssignments.find(f => f.field === 'description')
    const dateField = fieldAssignments.find(f => f.field === 'expense_date')
    const notesField = fieldAssignments.find(f => f.field === 'notes')

    // В режиме редактирования не требуем обязательные поля для предпросмотра
    if (!isEditingMode && (amountField?.assignedColumn === null || amountField?.assignedColumn === undefined ||
        descriptionField?.assignedColumn === null || descriptionField?.assignedColumn === undefined)) {
      return []
    }

    // Создаем переупорядоченные данные согласно columnOrder
    const reorderedData = sampleData.map(row => {
      const reorderedRow: string[] = []
      columnOrder.forEach((originalIndex, newIndex) => {
        reorderedRow[newIndex] = row[originalIndex] || ''
      })
      return reorderedRow
    })

    // Теперь используем новые индексы для получения данных
    return reorderedData.map(row => ({
      amount: amountField && amountField.assignedColumn !== null && amountField.assignedColumn !== undefined ? 
        row[columnOrder.indexOf(amountField.assignedColumn)] || '' : '',
      description: descriptionField && descriptionField.assignedColumn !== null && descriptionField.assignedColumn !== undefined ? 
        row[columnOrder.indexOf(descriptionField.assignedColumn)] || '' : '',
      expense_date: dateField && dateField.assignedColumn !== null && dateField.assignedColumn !== undefined ? 
        row[columnOrder.indexOf(dateField.assignedColumn)] || '' : '',
      notes: notesField && notesField.assignedColumn !== null && notesField.assignedColumn !== undefined ? 
        row[columnOrder.indexOf(notesField.assignedColumn)] || '' : ''
    }))
  }, [sampleData, fieldAssignments, columnOrder, isEditingMode])

  // Сброс к значениям по умолчанию
  const handleReset = useCallback(() => {
    if (sampleData.length === 0) return
    
    const columnCount = Math.max(...sampleData.map(row => row.length))
    
    setColumnOrder(Array.from({ length: columnCount }, (_, index) => index))
    setFieldAssignments([
      { field: 'amount', assignedColumn: null, required: true },
      { field: 'description', assignedColumn: null, required: true },
      { field: 'expense_date', assignedColumn: null, required: false },
      { field: 'notes', assignedColumn: null, required: false }
    ])
  }, [sampleData])

  if (sampleData.length === 0) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Настройка столбцов"
        size="lg"
      >
        <div className="text-center py-8">
          <div className="text-gray-500">
            <p className="text-lg mb-2">Нет данных для настройки</p>
            <p className="text-sm">Сначала вставьте или загрузите данные</p>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditingMode 
          ? "Редактирование сохраненной схемы столбцов" 
          : savedMapping && savedMapping.length === columnOrder.length 
            ? "Настройка столбцов (применена сохраненная схема)" 
            : "Настройка столбцов"
      }
      size="lg"
    >
      <div className="space-y-6">
        {/* Информация о режиме редактирования */}
        {isEditingMode && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-blue-800 font-medium">
                Режим редактирования сохраненной схемы
              </span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Изменения будут сохранены и применены к будущим массовым вводам
            </p>
          </div>
        )}

        {/* Таблица с данными и кликабельными заголовками */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-medium text-gray-900">Ваши данные</h3>
            <Tooltip content="Кликните на заголовок столбца чтобы назначить ему поле">
              <div className="w-4 h-4 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs cursor-help">
                ?
              </div>
            </Tooltip>
          </div>
          
          <div className="bg-white border rounded-lg overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="text-sm" style={{width: 'auto', minWidth: '100%'}}>
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {columnOrder.map((originalIndex, displayIndex) => {
                      const assignedField = getAssignedField(originalIndex)
                      return (
                        <th key={originalIndex} className="text-center whitespace-nowrap p-1">
                          <select
                            value={assignedField}
                            onChange={(e) => {
                              const newField = e.target.value as 'amount' | 'description' | 'expense_date' | 'notes' | 'skip'
                              if (newField === 'skip') {
                                // Убираем назначение
                                setFieldAssignments(prev => prev.map(assignment => 
                                  assignment.assignedColumn === originalIndex 
                                    ? { ...assignment, assignedColumn: null }
                                    : assignment
                                ))
                              } else {
                                // Назначаем поле
                                assignFieldToColumn(newField, originalIndex)
                              }
                            }}
                            className={`px-3 py-2 text-sm font-medium border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 rounded ${FIELD_COLORS[assignedField]} whitespace-nowrap text-center min-w-fit`}
                            style={{
                              appearance: 'none',
                              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                              backgroundPosition: 'right 0.5rem center',
                              backgroundRepeat: 'no-repeat',
                              backgroundSize: '1rem 1rem',
                              paddingRight: '2.5rem'
                            }}
                          >
                            <option value="skip">{String.fromCharCode(65 + displayIndex)}</option>
                            <option value="amount">💰 Сумма</option>
                            <option value="description">📝 Описание</option>
                            <option value="expense_date">📅 Дата</option>
                            <option value="notes">📋 Примечания</option>
                          </select>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {sampleData.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b hover:bg-gray-50">
                      {columnOrder.map((originalIndex, displayIndex) => (
                        <td key={originalIndex} className="px-4 py-3 text-gray-900 whitespace-nowrap">
                          {row[originalIndex] || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sampleData.length > 5 && (
              <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600 text-center">
                ... и еще {sampleData.length - 5} записей
              </div>
            )}
          </div>
        </div>

        {/* Предпросмотр результата */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-medium text-gray-900">Предпросмотр результата</h3>
            <Tooltip content="Посмотрите как будут обработаны ваши данные с текущими настройками">
              <div className="w-4 h-4 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs cursor-help">
                ?
              </div>
            </Tooltip>
          </div>
          
          {previewData.length > 0 ? (
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 whitespace-nowrap">💰 Сумма</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 whitespace-nowrap">📝 Описание</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 whitespace-nowrap">📅 Дата</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 whitespace-nowrap">📋 Примечания</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 5).map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-green-700 whitespace-nowrap">
                          {row.amount || '—'}
                        </td>
                        <td className="px-4 py-3 text-blue-700 whitespace-nowrap">
                          {row.description || '—'}
                        </td>
                        <td className="px-4 py-3 text-purple-700 whitespace-nowrap">
                          {row.expense_date || '—'}
                        </td>
                        <td className="px-4 py-3 text-yellow-700 whitespace-nowrap">
                          {row.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewData.length > 5 && (
                <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600 text-center">
                  ... и еще {previewData.length - 5} записей
                </div>
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="text-yellow-600">⚠️</div>
                <div className="text-sm text-yellow-800">
                  Назначьте хотя бы поля &quot;Сумма&quot; и &quot;Описание&quot; для предпросмотра данных
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Кнопки действий */}
        <div className="flex justify-between items-center pt-6 border-t">
          <div className="flex space-x-3">
            <Tooltip content="Вернуть настройки к значениям по умолчанию">
              <Button
                variant="outline"
                onClick={handleReset}
                className="text-gray-600"
              >
                🔄 Сбросить
              </Button>
            </Tooltip>
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Отмена
            </Button>
            
            {isEditingMode ? (
              <Tooltip content="Сохранить новые настройки столбцов">
                <Button
                  variant="primary"
                  onClick={handleApply}
                >
                  ✅ Применить новые настройки
                </Button>
              </Tooltip>
            ) : (
              <>
                <Tooltip content="Применить настройки и продолжить редактирование">
                  <Button
                    variant="outline"
                    onClick={handleApply}
                    disabled={previewData.length === 0}
                  >
                    📝 Применить и редактировать
                  </Button>
                </Tooltip>
                
                {onApplyAndSave && (
                  <Tooltip content="Применить настройки и сразу сохранить все расходы">
                    <Button
                      variant="primary"
                      onClick={handleApplyAndSave}
                      disabled={previewData.length === 0}
                    >
                      💾 Применить и сохранить
                    </Button>
                  </Tooltip>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}