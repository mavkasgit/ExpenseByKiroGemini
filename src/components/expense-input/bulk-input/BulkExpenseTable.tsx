'use client'

import {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
  type KeyboardEvent as ReactKeyboardEvent,
  type ClipboardEvent as ReactClipboardEvent
} from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DatePicker } from '@/components/ui/DatePicker'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { TimeInput, TimeInputRef } from '@/components/ui/TimeInput'
import type { Category } from '@/types'
import type { BulkExpenseRowData } from '@/lib/validations/expenses'
import { useCitySynonyms } from '@/hooks/useCitySynonyms'
import { CityMarkerIcon } from '@/components/cities/CityMarkerIcon'
import { normaliseMarkerPreset } from '@/lib/utils/cityCoordinates'
import { cn } from '@/lib/utils'
import { toggleCityFavorite } from '@/lib/actions/cities'
import { useToast } from '@/hooks/useToast'

interface BulkExpenseTableProps {
  expenses: BulkExpenseRowData[]
  categories: Category[]
  validationErrors: Record<string, string>
  onUpdateRow: (tempId: string, field: keyof BulkExpenseRowData, value: any) => void
  onRemoveRow: (tempId: string) => void
  onPaste: (event: ReactClipboardEvent) => void
}

type CityOption = {
  cityId: string
  cityName: string
  markerPreset: string | null
  hasCoordinates: boolean
  synonyms: string[]
  isFavorite: boolean
}

export function BulkExpenseTable({
  expenses,
  categories,
  validationErrors,
  onUpdateRow,
  onRemoveRow,
  onPaste
}: BulkExpenseTableProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const { synonyms: citySynonyms, updateCityFavorite } = useCitySynonyms()
  const { showToast } = useToast()

  // Опции для селекта категорий
  const categoryOptions = [
    { value: '', label: 'Автоопределение' },
    ...categories.map(category => ({
      value: category.id,
      label: category.name,
      color: category.color || undefined
    }))
  ]
  const timeInputRefs = useRef<Record<string, TimeInputRef | null>>({})

  const [openCityDropdownId, setOpenCityDropdownId] = useState<string | null>(null)
  const [highlightedCityIndex, setHighlightedCityIndex] = useState(0)
  const [favoriteMutationCityId, setFavoriteMutationCityId] = useState<string | null>(null)
  const cityDropdownTimeoutRef = useRef<number | null>(null)

  const { cityOptions, cityLookupBySynonym, cityLookupById } = useMemo(() => {
    const byId = new Map<string, CityOption>()
    const bySynonym = new Map<string, CityOption>()
    const synonymsRegistry = new Map<string, Set<string>>()

    citySynonyms.forEach((record) => {
      const existing = byId.get(record.cityId)

      const synonymsSet = (() => {
        let set = synonymsRegistry.get(record.cityId)
        if (!set) {
          set = new Set<string>()
          synonymsRegistry.set(record.cityId, set)
        }
        return set
      })()

      const baseOption: CityOption = existing ?? {
        cityId: record.cityId,
        cityName: record.cityName,
        markerPreset: record.markerPreset,
        hasCoordinates: record.hasCoordinates,
        synonyms: [record.cityName],
        isFavorite: record.isFavorite
      }

      if (!existing) {
        byId.set(record.cityId, baseOption)
        synonymsSet.add(record.cityName.trim().toLowerCase())
      }

      if (record.markerPreset && !baseOption.markerPreset) {
        baseOption.markerPreset = record.markerPreset
      }

      if (record.hasCoordinates) {
        baseOption.hasCoordinates = true
      }

      if (record.isFavorite && !baseOption.isFavorite) {
        baseOption.isFavorite = true
      }

      const synonymNormalized = record.synonym.trim().toLowerCase()
      if (!synonymsSet.has(synonymNormalized)) {
        baseOption.synonyms.push(record.synonym)
        synonymsSet.add(synonymNormalized)
      }

      bySynonym.set(synonymNormalized, baseOption)
      bySynonym.set(record.cityName.trim().toLowerCase(), baseOption)
    })

    const options = Array.from(byId.values()).sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) {
        return a.isFavorite ? -1 : 1
      }
      return a.cityName.localeCompare(b.cityName, 'ru')
    })

    return {
      cityOptions: options,
      cityLookupBySynonym: bySynonym,
      cityLookupById: new Map(options.map(option => [option.cityId, option] as const))
    }
  }, [citySynonyms])

  const resolveCityByInput = useCallback((value: string): CityOption | null => {
    const normalized = value.trim().toLowerCase()
    if (!normalized) {
      return null
    }
    return cityLookupBySynonym.get(normalized) ?? null
  }, [cityLookupBySynonym])

  const clearCityDropdownTimeout = useCallback(() => {
    if (cityDropdownTimeoutRef.current) {
      window.clearTimeout(cityDropdownTimeoutRef.current)
      cityDropdownTimeoutRef.current = null
    }
  }, [])

  useEffect(() => () => {
    clearCityDropdownTimeout()
  }, [clearCityDropdownTimeout])



  // Обработка изменения значения в ячейке
  const handleCellChange = useCallback((
    tempId: string,
    field: keyof BulkExpenseRowData,
    value: any
  ) => {
    onUpdateRow(tempId, field, value)
  }, [onUpdateRow])

  const handleCityInputChange = useCallback((tempId: string, value: string) => {
    clearCityDropdownTimeout()
    const match = resolveCityByInput(value)
    onUpdateRow(tempId, 'city', value)
    onUpdateRow(tempId, 'city_input', value)
    onUpdateRow(tempId, 'city_id', match?.cityId ?? null)
    if (value.trim()) {
      setOpenCityDropdownId(tempId)
    } else {
      setOpenCityDropdownId(null)
    }
    setHighlightedCityIndex(0)
  }, [clearCityDropdownTimeout, onUpdateRow, resolveCityByInput])

  const handleCitySelect = useCallback((tempId: string, option: CityOption) => {
    clearCityDropdownTimeout()
    onUpdateRow(tempId, 'city', option.cityName)
    onUpdateRow(tempId, 'city_input', option.cityName)
    onUpdateRow(tempId, 'city_id', option.cityId)
    setOpenCityDropdownId(null)
    setHighlightedCityIndex(0)
  }, [clearCityDropdownTimeout, onUpdateRow])

  const handleCityInputFocus = useCallback((tempId: string, hasOptions: boolean) => {
    clearCityDropdownTimeout()
    setEditingCell(`${tempId}-city`)
    if (hasOptions) {
      setOpenCityDropdownId(tempId)
      setHighlightedCityIndex(0)
    }
  }, [clearCityDropdownTimeout])

  const handleCityInputBlur = useCallback((tempId: string) => {
    clearCityDropdownTimeout()
    cityDropdownTimeoutRef.current = window.setTimeout(() => {
      setOpenCityDropdownId(current => (current === tempId ? null : current))
    }, 120)
  }, [clearCityDropdownTimeout])

  const handleCityFavoriteToggle = useCallback(async (option: CityOption | null) => {
    if (!option) {
      return
    }

    const nextValue = !option.isFavorite
    setFavoriteMutationCityId(option.cityId)

    try {
      const result = await toggleCityFavorite({ id: option.cityId, isFavorite: nextValue })
      if (result && 'error' in result && result.error) {
        showToast(result.error, 'error')
        return
      }

      updateCityFavorite(option.cityId, nextValue)
      showToast(
        nextValue
          ? `Город «${option.cityName}» добавлен в избранное`
          : `Город «${option.cityName}» убран из избранного`,
        'success'
      )
    } catch (error) {
      console.error('Failed to toggle favorite city in bulk input', error)
      showToast('Не удалось обновить избранный город', 'error')
    } finally {
      setFavoriteMutationCityId(null)
    }
  }, [showToast, updateCityFavorite])

  // Обработка нажатия Enter для перехода к следующей ячейке
  const handleKeyDown = useCallback((
    event: ReactKeyboardEvent,
    tempId: string,
    field: keyof BulkExpenseRowData
  ) => {
    if (event.key === 'Enter') {
      event.preventDefault()

      const currentIndex = expenses.findIndex(e => e.tempId === tempId)
      const fields: (keyof BulkExpenseRowData)[] = ['amount', 'description', 'city', 'expense_date', 'expense_time', 'notes']
      const currentFieldIndex = fields.indexOf(field)

      // Переход к следующему полю или следующей строке
      if (currentFieldIndex < fields.length - 1) {
        const nextField = fields[currentFieldIndex + 1]
        setEditingCell(`${tempId}-${nextField}`)
      } else if (currentIndex < expenses.length - 1) {
        const nextExpense = expenses[currentIndex + 1]
        setEditingCell(`${nextExpense.tempId}-amount`)
      }
    }
  }, [expenses])

  const handleCityKeyDown = useCallback((
    event: ReactKeyboardEvent<HTMLInputElement>,
    tempId: string,
    filteredOptions: CityOption[]
  ) => {
    const isOpen = openCityDropdownId === tempId

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      clearCityDropdownTimeout()
      if (!isOpen) {
        if (filteredOptions.length > 0) {
          setOpenCityDropdownId(tempId)
          setHighlightedCityIndex(0)
        }
      } else if (filteredOptions.length > 0) {
        setHighlightedCityIndex(prev => (prev + 1) % filteredOptions.length)
      }
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      clearCityDropdownTimeout()
      if (!isOpen) {
        if (filteredOptions.length > 0) {
          setOpenCityDropdownId(tempId)
          setHighlightedCityIndex(filteredOptions.length - 1)
        }
      } else if (filteredOptions.length > 0) {
        setHighlightedCityIndex(prev => (prev - 1 + filteredOptions.length) % filteredOptions.length)
      }
      return
    }

    if (event.key === 'Escape') {
      if (isOpen) {
        event.preventDefault()
        setOpenCityDropdownId(null)
        setHighlightedCityIndex(0)
      }
      return
    }

    if (event.key === 'Enter') {
      if (isOpen && filteredOptions[highlightedCityIndex]) {
        event.preventDefault()
        handleCitySelect(tempId, filteredOptions[highlightedCityIndex])
        return
      }
      setOpenCityDropdownId(null)
      setHighlightedCityIndex(0)
      handleKeyDown(event, tempId, 'city')
      return
    }

    handleKeyDown(event, tempId, 'city')
  }, [clearCityDropdownTimeout, handleCitySelect, handleKeyDown, highlightedCityIndex, openCityDropdownId])

  // Получение ошибки для ячейки
  const getCellError = useCallback((tempId: string, field: string) => {
    return validationErrors[`${tempId}-${field}`]
  }, [validationErrors])

  // Форматирование суммы для отображения
  const formatAmount = useCallback((amount: number) => {
    return amount > 0 ? amount.toString() : ''
  }, [])

  return (
    <div className="overflow-x-auto">
      <div
        className="min-w-full"
        onPaste={onPaste}
        tabIndex={0}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700 w-24">
                №
              </th>
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700 w-32">
                Сумма *
              </th>
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700 min-w-48">
                Описание *
              </th>
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700 min-w-40">
                Город
              </th>
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700 w-32">
                Дата *
              </th>
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700 w-24">
                Время
              </th>
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700 w-48">
                Категория
              </th>
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700 min-w-48">
                Примечания
              </th>
              <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700 w-16">
                Действия
              </th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense, index) => {
              const tempId = expense.tempId || index.toString()
              const cityValue = expense.city ? expense.city : ''
              const resolvedCity = expense.city_id
                ? cityLookupById.get(expense.city_id) ?? null
                : resolveCityByInput(cityValue)
              const filteredCityOptions = (() => {
                const query = cityValue.trim().toLowerCase()
                const base = query
                  ? cityOptions.filter((option) =>
                      option.cityName.toLowerCase().includes(query) ||
                      option.synonyms.some((synonym) => synonym.toLowerCase().includes(query))
                    )
                  : cityOptions

                return base.slice(0, 6)
              })()
              const resolvedMarkerPreset = resolvedCity ? normaliseMarkerPreset(resolvedCity.markerPreset) : undefined
              const isCityDropdownOpen = openCityDropdownId === tempId
              const cityError = getCellError(tempId, 'city')
              const isFavoriteUpdatingForRow = resolvedCity ? favoriteMutationCityId === resolvedCity.cityId : false
              const favoriteButtonTitleForRow = resolvedCity
                ? resolvedCity.isFavorite
                  ? `Убрать «${resolvedCity.cityName}» из избранного`
                  : `Добавить «${resolvedCity.cityName}» в избранное`
                : 'Выберите город, чтобы добавить его в избранное'

              return (
                <tr key={tempId} className="hover:bg-gray-50">
                  {/* Номер строки */}
                  <td className="border border-gray-300 px-3 py-2 text-sm text-gray-600 text-center">
                    {index + 1}
                  </td>

                  {/* Сумма */}
                  <td 
                    className="border border-gray-300 px-1 py-1 cursor-pointer hover:bg-gray-50"
                    onClick={(e) => {
                      const input = e.currentTarget.querySelector('input')
                      input?.focus()
                    }}
                  >
                    <div className="space-y-1">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formatAmount(expense.amount)}
                        onChange={(e) => handleCellChange(tempId, 'amount', parseFloat(e.target.value) || 0)}
                        onKeyDown={(e) => handleKeyDown(e, tempId, 'amount')}
                        onFocus={() => setEditingCell(`${tempId}-amount`)}
                        className={`text-sm ${getCellError(tempId, 'amount') ? 'border-red-500' : ''}`}
                        placeholder="0.00"
                      />
                      {getCellError(tempId, 'amount') && (
                        <ErrorMessage error={getCellError(tempId, 'amount')} />
                      )}
                    </div>
                  </td>

                  {/* Описание */}
                  <td 
                    className="border border-gray-300 px-1 py-1 cursor-pointer hover:bg-gray-50"
                    onClick={(e) => {
                      const input = e.currentTarget.querySelector('input')
                      input?.focus()
                    }}
                  >
                    <div className="space-y-1">
                      <Input
                        type="text"
                        value={expense.description}
                        onChange={(e) => handleCellChange(tempId, 'description', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, tempId, 'description')}
                        onFocus={() => setEditingCell(`${tempId}-description`)}
                        className={`text-sm ${getCellError(tempId, 'description') ? 'border-red-500' : ''}`}
                        placeholder="Описание расхода"
                      />
                      {getCellError(tempId, 'description') && (
                        <ErrorMessage error={getCellError(tempId, 'description')} />
                      )}
                    </div>
                  </td>

                  {/* Город */}
                  <td
                    className="border border-gray-300 px-1 py-1 cursor-pointer hover:bg-gray-50"
                    onClick={(e) => {
                      const input = e.currentTarget.querySelector('input')
                      input?.focus()
                    }}
                  >
                    <div className="space-y-1">
                      <div className="relative">
                        <Input
                          type="text"
                          value={cityValue}
                          onChange={(e) => handleCityInputChange(tempId, e.target.value)}
                          onKeyDown={(e) => handleCityKeyDown(e, tempId, filteredCityOptions)}
                          onFocus={() => handleCityInputFocus(tempId, filteredCityOptions.length > 0)}
                          onBlur={() => handleCityInputBlur(tempId)}
                          className={cn(
                            'text-sm pl-16',
                            cityError ? 'border-red-500' : ''
                          )}
                          placeholder="Город"
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center gap-1 pl-3 pr-2">
                          <span className="pointer-events-none">
                            <CityMarkerIcon
                              preset={resolvedMarkerPreset}
                              active={resolvedCity ? resolvedCity.hasCoordinates : false}
                            />
                          </span>
                          <button
                            type="button"
                            className={cn(
                              'rounded-md p-1 text-xs transition focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-0',
                              resolvedCity?.isFavorite
                                ? 'text-amber-500 hover:text-amber-600'
                                : 'text-slate-300 hover:text-slate-400',
                              (!resolvedCity || isFavoriteUpdatingForRow)
                                ? 'cursor-not-allowed opacity-60 hover:text-slate-300'
                                : 'cursor-pointer'
                            )}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              if (!resolvedCity || isFavoriteUpdatingForRow) {
                                return
                              }
                              void handleCityFavoriteToggle(resolvedCity)
                            }}
                            disabled={!resolvedCity || isFavoriteUpdatingForRow}
                            aria-pressed={resolvedCity?.isFavorite ?? false}
                            aria-label={favoriteButtonTitleForRow}
                            title={favoriteButtonTitleForRow}
                          >
                            <span className={cn(isFavoriteUpdatingForRow && 'animate-pulse')}>
                              {resolvedCity?.isFavorite ? '★' : '☆'}
                            </span>
                          </button>
                        </div>

                        {isCityDropdownOpen && filteredCityOptions.length > 0 && (
                          <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
                            <ul
                              className="max-h-48 overflow-auto py-1"
                              onMouseDown={(event) => event.preventDefault()}
                            >
                              {filteredCityOptions.map((option, optionIndex) => {
                                const preset = option.markerPreset ? normaliseMarkerPreset(option.markerPreset) : undefined
                                const secondaryLabels = option.synonyms
                                  .filter((synonym) => synonym !== option.cityName)
                                  .slice(0, 2)

                                return (
                                  <li key={option.cityId}>
                                    <button
                                      type="button"
                                      className={cn(
                                        'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition',
                                        highlightedCityIndex === optionIndex
                                          ? 'bg-sky-50 text-sky-700'
                                          : 'text-slate-700 hover:bg-slate-50'
                                      )}
                                      onMouseDown={(event) => event.preventDefault()}
                                      onClick={() => handleCitySelect(tempId, option)}
                                    >
                                      <CityMarkerIcon preset={preset} active={option.hasCoordinates} />
                                      {option.isFavorite && (
                                        <span className="text-amber-500">★</span>
                                      )}
                                      <span className="flex-1 truncate">{option.cityName}</span>
                                      {secondaryLabels.length > 0 && (
                                        <span className="max-w-[140px] truncate text-[11px] text-slate-400">
                                          {secondaryLabels.join(', ')}
                                        </span>
                                      )}
                                    </button>
                                  </li>
                                )
                              })}
                            </ul>
                          </div>
                        )}
                      </div>
                      {cityError && (
                        <ErrorMessage error={cityError} />
                      )}
                    </div>
                  </td>

                  {/* Дата */}
                  <td 
                    className="border border-gray-300 px-1 py-1 cursor-pointer hover:bg-gray-50"
                    onClick={(e) => {
                      const input = e.currentTarget.querySelector('input')
                      input?.focus()
                    }}
                  >
                    <div className="space-y-1">
                      <DatePicker
                        value={expense.expense_date}
                        onChange={(value) => handleCellChange(tempId, 'expense_date', value)}
                        onKeyPress={(e) => handleKeyDown(e, tempId, 'expense_date')}
                        className={`text-sm ${getCellError(tempId, 'expense_date') ? 'border-red-500' : ''}`}
                      />
                      {getCellError(tempId, 'expense_date') && (
                        <ErrorMessage error={getCellError(tempId, 'expense_date')} />
                      )}
                    </div>
                  </td>

                  {/* Время */}
                  <td 
                    className="border border-gray-300 px-1 py-1 cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setEditingCell(`${tempId}-expense_time`)
                      timeInputRefs.current[tempId]?.focus()
                    }}
                  >
                    <div className="space-y-1">
                      <TimeInput
                        ref={(ref) => {
                          if (ref) {
                            timeInputRefs.current[tempId] = ref
                          }
                        }}
                        value={expense.expense_time || ''}
                        onChange={(value) => handleCellChange(tempId, 'expense_time', value)}
                        onKeyPress={(e) => handleKeyDown(e, tempId, 'expense_time')}
                        onFocus={() => setEditingCell(`${tempId}-expense_time`)}
                        disabled={false}
                        className={`text-sm ${getCellError(tempId, 'expense_time') ? 'ring-red-500' : ''}`}
                      />
                      {getCellError(tempId, 'expense_time') && (
                        <ErrorMessage error={getCellError(tempId, 'expense_time')} />
                      )}
                    </div>
                  </td>

                  {/* Категория */}
                  <td className="border border-gray-300 px-1 py-1">
                    <SearchableSelect
                      options={categoryOptions}
                      value={expense.category_id || ''}
                      onChange={(value) => handleCellChange(tempId, 'category_id', value)}
                      placeholder="Выберите категорию"
                      className="text-sm"
                    />
                  </td>

                  {/* Примечания */}
                  <td 
                    className="border border-gray-300 px-1 py-1 cursor-pointer hover:bg-gray-50"
                    onClick={(e) => {
                      const input = e.currentTarget.querySelector('input')
                      input?.focus()
                    }}
                  >
                    <Input
                      type="text"
                      value={expense.notes || ''}
                      onChange={(e) => handleCellChange(tempId, 'notes', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, tempId, 'notes')}
                      onFocus={() => setEditingCell(`${tempId}-notes`)}
                      className="text-sm"
                      placeholder="Дополнительные заметки"
                    />
                  </td>

                  {/* Действия */}
                  <td className="border border-gray-300 px-1 py-1 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRemoveRow(tempId)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
                      title="Удалить строку"
                    >
                      🗑️
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {expenses.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 space-y-1">
            <p>💡 <strong>Советы:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Используйте Tab или Enter для перехода между ячейками</li>
              <li>Обязательные поля отмечены звёздочкой (*)</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}