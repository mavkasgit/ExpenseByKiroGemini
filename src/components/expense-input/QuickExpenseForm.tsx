'use client'

import {
  useState,
  useTransition,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  type KeyboardEvent as ReactKeyboardEvent
} from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { DatePicker } from '@/components/ui/DatePicker'
import { TimeInput } from '@/components/ui/TimeInput'
import { createExpense } from '@/lib/actions/expenses'
import { toggleCityFavorite } from '@/lib/actions/cities'
import { getCurrentDateISO, getCurrentTimeHHMM } from '@/lib/utils/dateUtils'
import type { CreateExpenseData } from '@/types'
import { useToast } from '@/hooks/useToast'
import { getUserSettings, UserSettings } from '@/lib/actions/settings'
import { useCitySynonyms } from '@/hooks/useCitySynonyms'
import { CityMarkerIcon } from '@/components/cities/CityMarkerIcon'
import { normaliseMarkerPreset } from '@/lib/utils/cityCoordinates'
import { cn } from '@/lib/utils'

interface QuickExpenseFormProps {
  onSuccess?: (expense: any) => void
  className?: string
}

export function QuickExpenseForm({
  onSuccess,
  className = '' 
}: QuickExpenseFormProps) {
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()
  const amountInputRef = useRef<HTMLInputElement>(null)
  const cityInputRef = useRef<HTMLInputElement>(null)
  const cityDropdownTimeoutRef = useRef<number | null>(null)

  const [formData, setFormData] = useState({
    amount: 0,
    description: '',
    notes: '',
    expense_date: getCurrentDateISO(),
    expense_time: getCurrentTimeHHMM(),
    cityId: '',
    cityInput: '',
    input_method: 'single' as const
  })

  const [userSettings, setUserSettings] = useState<UserSettings>({})
  const { synonyms: citySynonyms, updateCityFavorite } = useCitySynonyms()

  type CityOption = {
    cityId: string
    cityName: string
    markerPreset: string | null
    hasCoordinates: boolean
    synonyms: string[]
    isFavorite: boolean
  }

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

      if (record.isFavorite && !baseOption.isFavorite) {
        baseOption.isFavorite = true
      }

      if (record.markerPreset && !baseOption.markerPreset) {
        baseOption.markerPreset = record.markerPreset
      }

      if (record.hasCoordinates) {
        baseOption.hasCoordinates = true
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
      cityLookupById: new Map(options.map((option) => [option.cityId, option] as const))
    }
  }, [citySynonyms])

  const resolveCityByInput = useCallback((value: string): CityOption | null => {
    const normalized = value.trim().toLowerCase()
    if (!normalized) {
      return null
    }
    return cityLookupBySynonym.get(normalized) ?? null
  }, [cityLookupBySynonym])

  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false)
  const [highlightedCityIndex, setHighlightedCityIndex] = useState(0)
  const [favoriteMutationCityId, setFavoriteMutationCityId] = useState<string | null>(null)

  const resolvedCity = useMemo(() => {
    if (formData.cityId) {
      return cityLookupById.get(formData.cityId) ?? null
    }
    if (formData.cityInput) {
      return resolveCityByInput(formData.cityInput)
    }
    return null
  }, [cityLookupById, formData.cityId, formData.cityInput, resolveCityByInput])

  const filteredCityOptions = useMemo(() => {
    const query = formData.cityInput.trim().toLowerCase()
    const base = query
      ? cityOptions.filter((option) =>
          option.cityName.toLowerCase().includes(query) ||
          option.synonyms.some((synonym) => synonym.toLowerCase().includes(query))
        )
      : cityOptions

    return base.slice(0, 6)
  }, [cityOptions, formData.cityInput])

  const resolvedMarkerPreset = resolvedCity ? normaliseMarkerPreset(resolvedCity.markerPreset) : undefined
  const isFavoriteUpdating = resolvedCity ? favoriteMutationCityId === resolvedCity.cityId : false
  const favoriteButtonTitle = resolvedCity
    ? resolvedCity.isFavorite
      ? `Убрать «${resolvedCity.cityName}» из избранного`
      : `Добавить «${resolvedCity.cityName}» в избранное`
    : 'Выберите город, чтобы добавить его в избранное'

  const handleToggleFavoriteCity = useCallback(async () => {
    if (!resolvedCity) {
      return
    }

    const nextValue = !resolvedCity.isFavorite
    setFavoriteMutationCityId(resolvedCity.cityId)

    try {
      const result = await toggleCityFavorite({ id: resolvedCity.cityId, isFavorite: nextValue })
      if (result && 'error' in result && result.error) {
        showToast(result.error, 'error')
        return
      }

      updateCityFavorite(resolvedCity.cityId, nextValue)
      showToast(
        nextValue
          ? `Город «${resolvedCity.cityName}» добавлен в избранное`
          : `Город «${resolvedCity.cityName}» убран из избранного`,
        'success'
      )
    } catch (error) {
      console.error('Failed to toggle city favorite', error)
      showToast('Не удалось обновить избранный город', 'error')
    } finally {
      setFavoriteMutationCityId(null)
    }
  }, [resolvedCity, showToast, updateCityFavorite])

  useEffect(() => {
    setHighlightedCityIndex(0)
  }, [filteredCityOptions])

  useEffect(() => () => {
    if (cityDropdownTimeoutRef.current) {
      window.clearTimeout(cityDropdownTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    const fetchSettings = async () => {
      const result = await getUserSettings();
      if (result.settings) {
        setUserSettings(result.settings);
      }
    };
    fetchSettings();
  }, []);

  // Обработка изменения описания
  const handleDescriptionChange = (value: string) => {
    setFormData(prev => ({ ...prev, description: value }))
  }

  const handleCityInputChange = (value: string) => {
    const match = resolveCityByInput(value)
    setFormData(prev => ({
      ...prev,
      cityInput: value,
      cityId: match?.cityId ?? ''
    }))
    setIsCityDropdownOpen(Boolean(value))
    setHighlightedCityIndex(0)
  }

  const handleCitySelect = (option: CityOption) => {
    setFormData(prev => ({
      ...prev,
      cityInput: option.cityName,
      cityId: option.cityId
    }))
    setIsCityDropdownOpen(false)
    if (cityInputRef.current) {
      cityInputRef.current.blur()
    }
  }

  const handleCityInputFocus = () => {
    if (cityDropdownTimeoutRef.current) {
      window.clearTimeout(cityDropdownTimeoutRef.current)
      cityDropdownTimeoutRef.current = null
    }
    if (filteredCityOptions.length > 0) {
      setIsCityDropdownOpen(true)
    }
  }

  const handleCityInputBlur = () => {
    cityDropdownTimeoutRef.current = window.setTimeout(() => {
      setIsCityDropdownOpen(false)
    }, 120)
  }

  const handleCityKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!isCityDropdownOpen) {
        setIsCityDropdownOpen(true)
        setHighlightedCityIndex(0)
        return
      }
      if (filteredCityOptions.length > 0) {
        setHighlightedCityIndex(prev => (prev + 1) % filteredCityOptions.length)
      }
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!isCityDropdownOpen) {
        setIsCityDropdownOpen(true)
        setHighlightedCityIndex(filteredCityOptions.length > 0 ? filteredCityOptions.length - 1 : 0)
        return
      }
      if (filteredCityOptions.length > 0) {
        setHighlightedCityIndex(prev => (prev - 1 + filteredCityOptions.length) % filteredCityOptions.length)
      }
      return
    }

    if (event.key === 'Enter') {
      if (isCityDropdownOpen && filteredCityOptions[highlightedCityIndex]) {
        event.preventDefault()
        handleCitySelect(filteredCityOptions[highlightedCityIndex])
        return
      }
      if (!isPending) {
        event.preventDefault()
        handleQuickSubmit()
      }
      return
    }

    if (event.key === 'Escape') {
      setIsCityDropdownOpen(false)
    }
  }

  // Быстрая отправка формы (Enter в любом поле)
  const handleQuickSubmit = async () => {
    // Базовая валидация
    if (!formData.amount || formData.amount <= 0) {
      showToast('Введите сумму расхода', 'error')
      amountInputRef.current?.focus()
      return
    }

    if (!formData.description || formData.description.trim().length === 0) {
      showToast('Введите описание для автоматической категоризации', 'error')
      return
    }

    startTransition(async () => {
      try {
        // Создаем расход без указания категории
        const trimmedCityInput = formData.cityInput.trim()

        const expenseData: CreateExpenseData = {
          amount: formData.amount,
          description: formData.description,
          notes: formData.notes || undefined,
          expense_date: formData.expense_date,
          expense_time: formData.expense_time || undefined,
          city_id: resolvedCity?.cityId || undefined,
          city_input: trimmedCityInput || undefined,
          input_method: formData.input_method
          // category_id не указываем - система автоматически определит
        }

        const result = await createExpense(expenseData)

        if (result.error) {
          showToast(result.error, 'error')
          return
        }

        // Показываем результат категоризации
        if (result.data?.auto_categorized) {
          showToast('Расход добавлен и категоризирован', 'success')
        } else {
          showToast('Расход добавлен в неопознанные', 'info')
        }
        
        // Сбрасываем форму, но оставляем дату и обновляем время
        setFormData(prev => ({
          amount: 0,
          description: '',
          notes: '',
          expense_date: prev.expense_date, // Оставляем дату
          expense_time: getCurrentTimeHHMM(), // Обновляем время на текущее
          cityId: '',
          cityInput: '',
          input_method: 'single'
        }))
        setIsCityDropdownOpen(false)

        // Фокус обратно на сумму для следующего ввода
        setTimeout(() => {
          amountInputRef.current?.focus()
        }, 100)

        // Вызываем callback
        if (onSuccess) {
          onSuccess(result.data)
        }
      } catch (error) {
        console.error('Ошибка создания расхода:', error)
        showToast('Произошла ошибка', 'error')
      }
    })
  }

  // Обработка Enter в полях
  const handleKeyPress = (e: ReactKeyboardEvent<Element>) => {
    if (e.key === 'Enter' && !isPending) {
      e.preventDefault()
      handleQuickSubmit()
    }
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-700 mb-3">
          Быстрый ввод расхода
        </div>

        {/* Сумма и описание в одной строке */}
        <div className="grid grid-cols-2 gap-3">
          {/* Сумма */}
          <div>
            <Input
              ref={amountInputRef}
              type="number"
              step="0.01"
              min="0"
              value={formData.amount || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                amount: parseFloat(e.target.value) || 0
              }))}
              onKeyPress={handleKeyPress}
              placeholder="Сумма"
              disabled={isPending}
              className="text-lg"
            />
          </div>

          {/* Описание */}
          <div>
            <Input
              type="text"
              value={formData.description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Описание для автокатегоризации"
              disabled={isPending}
            />
          </div>
        </div>

        {/* Примечание */}
        <div>
          <Input
            type="text"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              notes: e.target.value
            }))}
            onKeyPress={handleKeyPress}
            placeholder="Примечание (необязательно)"
            disabled={isPending}
            maxLength={1000}
          />
        </div>

        {/* Город */}
        <div className="grid grid-cols-1 gap-2">
          <div className="relative">
            <Input
              ref={cityInputRef}
              type="text"
              value={formData.cityInput}
              onChange={(e) => handleCityInputChange(e.target.value)}
              onKeyDown={handleCityKeyDown}
              onFocus={handleCityInputFocus}
              onBlur={handleCityInputBlur}
              placeholder="Город"
              disabled={isPending}
              maxLength={100}
              className="pl-16"
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
                  (!resolvedCity || isFavoriteUpdating)
                    ? 'cursor-not-allowed opacity-60 hover:text-slate-300'
                    : 'cursor-pointer'
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  if (!resolvedCity || isFavoriteUpdating) {
                    return
                  }
                  void handleToggleFavoriteCity()
                }}
                disabled={!resolvedCity || isFavoriteUpdating}
                aria-pressed={resolvedCity?.isFavorite ?? false}
                aria-label={favoriteButtonTitle}
                title={favoriteButtonTitle}
              >
                <span className={cn(isFavoriteUpdating && 'animate-pulse')}>
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
                  {filteredCityOptions.map((option, index) => {
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
                            highlightedCityIndex === index
                              ? 'bg-sky-50 text-sky-700'
                              : 'text-slate-700 hover:bg-slate-50'
                          )}
                          onClick={() => handleCitySelect(option)}
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
          <div className="min-h-[1rem] text-xs text-slate-500">
            {formData.cityInput
              ? resolvedCity
                ? `Определён город «${resolvedCity.cityName}»`
                : 'Новый город будет сохранён как непознанный'
              : 'Укажите город, чтобы привязать расход к карте'}
          </div>
        </div>

        {/* Дата и время */}
        <div className="grid grid-cols-2 gap-3">
          {/* Дата */}
          <div>
            <DatePicker
              value={formData.expense_date}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                expense_date: value
              }))}
              onKeyPress={handleKeyPress}
              disabled={isPending}
              placeholder="Дата"
            />
          </div>

          {/* Время */}
          <div>
            <TimeInput
              value={formData.expense_time}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                expense_time: value
              }))}
              onKeyPress={handleKeyPress}
              disabled={isPending}
            />
          </div>
        </div>

        <div className="text-xs text-blue-600">
          💡 Система определит категорию автоматически
        </div>

        {/* Кнопка добавления */}
        <Button
          onClick={handleQuickSubmit}
          disabled={isPending || !formData.amount || !formData.description.trim()}
          className="w-full"
          size="sm"
        >
          {isPending ? 'Добавление...' : 'Добавить (Enter)'}
        </Button>

        {/* Подсказка */}
        <div className="text-xs text-gray-500 text-center">
          Нажмите Enter в любом поле для быстрого добавления
        </div>
      </div>
    </Card>
  )
}