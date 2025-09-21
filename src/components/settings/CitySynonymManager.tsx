'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import {
  getCitySynonyms,
  createCitySynonym,
  deleteCitySynonym,
  updateCityName,
  deleteCity
} from '@/lib/actions/synonyms'
import { syncCitySynonyms } from '@/lib/utils/cityParser'
import type { CitySynonym } from '@/types'
import { AddSynonymForm } from './AddSynonymForm'
import { CityMap } from './CityMap'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'

interface SynonymFormState {
  city: string
  synonym: string
}

interface CitySummary {
  name: string
  total: number
  alternate: number
}

export function CitySynonymManager() {
  const [synonyms, setSynonyms] = useState<CitySynonym[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [formState, setFormState] = useState<SynonymFormState>({ city: '', synonym: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingMap, setDeletingMap] = useState<Record<string, boolean>>({})
  const [activeCity, setActiveCity] = useState<string | null>(null)
  const [editingCityId, setEditingCityId] = useState<string | null>(null)
  const [editingCityName, setEditingCityName] = useState('')
  const [isCityUpdating, setIsCityUpdating] = useState(false)
  const [cityToDelete, setCityToDelete] = useState<{ id: string; name: string } | null>(null)
  const [isDeletingCity, setIsDeletingCity] = useState(false)
  const { showToast } = useToast()

  const loadSynonyms = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getCitySynonyms()
      if (result.error) {
        showToast(result.error, 'error')
      } else if (result.success && result.data) {
        setSynonyms(result.data)
        syncCitySynonyms(result.data.map(record => ({ city: record.city, synonym: record.synonym })))
      }
    } catch (error) {
      console.error('Failed to load city synonyms', error)
      showToast('Не удалось загрузить синонимы городов', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadSynonyms()
  }, [loadSynonyms])

  const groupedSynonyms = useMemo(() => {
    const map = new Map<string, CitySynonym[]>()
    synonyms.forEach(record => {
      const cityKey = record.city.trim() || 'Без города'
      if (!map.has(cityKey)) {
        map.set(cityKey, [])
      }
      map.get(cityKey)!.push(record)
    })
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], 'ru'))
  }, [synonyms])

  useEffect(() => {
    if (groupedSynonyms.length === 0) {
      setActiveCity(null)
      return
    }

    if (!activeCity || !groupedSynonyms.some(([city]) => city === activeCity)) {
      setActiveCity(groupedSynonyms[0][0])
    }
  }, [groupedSynonyms, activeCity])

  const stats = useMemo(() => {
    const totalCities = groupedSynonyms.length
    const citiesWithCustomSynonyms = groupedSynonyms.filter(([, entries]) =>
      entries.some(entry => entry.synonym.trim() && entry.synonym !== entry.city)
    ).length
    const totalSynonyms = synonyms.length
    const customSynonyms = synonyms.filter(entry => entry.synonym !== entry.city).length
    const coverage = totalCities === 0 ? 0 : Math.round((citiesWithCustomSynonyms / totalCities) * 100)

    return {
      totalCities,
      totalSynonyms,
      customSynonyms,
      coverage
    }
  }, [groupedSynonyms, synonyms])

  const citySummary: CitySummary[] = useMemo(() => {
    return groupedSynonyms.map(([city, entries]) => {
      const alternate = entries.filter(entry => entry.synonym !== city).length
      return {
        name: city,
        total: entries.length,
        alternate
      }
    })
  }, [groupedSynonyms])

  const toggleCity = (city: string) => {
    setActiveCity(prev => (prev === city ? null : city))
  }

  const handleCitySelect = (city: string) => {
    setActiveCity(city)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!formState.city.trim()) {
      showToast('Заполните название города', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const cityName = formState.city.trim()
      const result = await createCitySynonym({ city: cityName, synonym: cityName })
      if (result.error) {
        showToast(result.error, 'error')
      } else if (result.success && result.data) {
        setSynonyms(prev => {
          const updated = [...prev, result.data]
          syncCitySynonyms(updated.map(record => ({ city: record.city, synonym: record.synonym })))
          return updated
        })
        showToast('Город добавлен', 'success')
        setFormState({ city: '', synonym: '' })
      }
    } catch (error) {
      console.error('Failed to create city', error)
      showToast('Не удалось добавить город', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSynonym = async (synonym: CitySynonym) => {
    setDeletingMap(prev => ({ ...prev, [synonym.id]: true }))
    try {
      const result = await deleteCitySynonym({ id: synonym.id })
      if (result.error) {
        showToast(result.error, 'error')
      } else {
        setSynonyms(prev => {
          const updated = prev.filter(item => item.id !== synonym.id)
          syncCitySynonyms(updated.map(record => ({ city: record.city, synonym: record.synonym })))
          return updated
        })
        showToast('Синоним удален', 'success')
      }
    } catch (error) {
      console.error('Failed to delete city synonym', error)
      showToast('Не удалось удалить синоним', 'error')
    } finally {
      setDeletingMap(prev => ({ ...prev, [synonym.id]: false }))
    }
  }

  const handleStartEditCity = (cityId: string, cityName: string) => {
    setEditingCityId(cityId)
    setEditingCityName(cityName)
    setActiveCity(cityName)
  }

  const handleCancelEditCity = () => {
    setEditingCityId(null)
    setEditingCityName('')
  }

  const handleSubmitCityEdit = async (
    event: React.FormEvent<HTMLFormElement>,
    cityId: string,
    previousName: string
  ) => {
    event.preventDefault()

    const trimmedName = editingCityName.trim()
    if (!trimmedName) {
      showToast('Введите название города', 'error')
      return
    }

    if (trimmedName === previousName) {
      showToast('Название города не изменилось', 'info')
      handleCancelEditCity()
      return
    }

    setIsCityUpdating(true)
    try {
      const result = await updateCityName({ id: cityId, city: trimmedName })
      if (result.error) {
        showToast(result.error, 'error')
      } else {
        setSynonyms(prev => {
          const updated = prev.map(entry => {
            if (entry.city !== previousName) {
              return entry
            }

            const updatedEntry: CitySynonym = {
              ...entry,
              city: trimmedName,
              synonym: entry.id === cityId ? trimmedName : entry.synonym
            }

            return updatedEntry
          })

          syncCitySynonyms(updated.map(record => ({ city: record.city, synonym: record.synonym })))
          return updated
        })

        if (activeCity === previousName) {
          setActiveCity(trimmedName)
        }

        showToast('Город обновлён', 'success')
        handleCancelEditCity()
      }
    } catch (error) {
      console.error('Failed to update city', error)
      showToast('Не удалось обновить город', 'error')
    } finally {
      setIsCityUpdating(false)
    }
  }

  const handleOpenDeleteCity = (cityId: string, cityName: string) => {
    setCityToDelete({ id: cityId, name: cityName })
  }

  const handleCloseDeleteCity = () => {
    if (isDeletingCity) {
      return
    }
    setCityToDelete(null)
  }

  const handleConfirmDeleteCity = async () => {
    if (!cityToDelete) {
      return
    }

    setIsDeletingCity(true)
    try {
      const result = await deleteCity({ id: cityToDelete.id })
      if (result.error) {
        showToast(result.error, 'error')
      } else {
        setSynonyms(prev => {
          const updated = prev.filter(entry => entry.city !== cityToDelete.name)
          syncCitySynonyms(updated.map(record => ({ city: record.city, synonym: record.synonym })))
          return updated
        })

        if (activeCity === cityToDelete.name) {
          setActiveCity(null)
        }

        showToast('Город удалён', 'success')
        setCityToDelete(null)
      }
    } catch (error) {
      console.error('Failed to delete city', error)
      showToast('Не удалось удалить город', 'error')
    } finally {
      setIsDeletingCity(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)]">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>Справочник городов</CardTitle>
              <CardDescription>
                Рабочая область для управления городами и их альтернативными написаниями.
              </CardDescription>
            </div>
            <Button type="button" variant="outline" onClick={loadSynonyms} disabled={isLoading}>
              Обновить
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-end"
          >
            <div className="w-full sm:flex-1">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="synonym-city">
                Новый город
              </label>
              <Input
                id="synonym-city"
                placeholder="Например: Санкт-Петербург"
                value={formState.city}
                onChange={(event) => setFormState(prev => ({ ...prev, city: event.target.value, synonym: '' }))}
                disabled={isSubmitting}
                className="h-11"
              />
            </div>
            <Button type="submit" isLoading={isSubmitting} className="h-11 sm:w-auto">
              Добавить город
            </Button>
          </form>

          <div className="space-y-3">
            {isLoading ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                Загружаем текущий список городов…
              </div>
            ) : groupedSynonyms.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                Ничего не найдено. Добавьте новый город, чтобы начать работу.
              </div>
            ) : (
              groupedSynonyms.map(([city, entries]) => {
                const synonymsForCity = entries.filter(entry => entry.synonym !== city)
                const canonicalEntry = entries.find(entry => entry.synonym === city) ?? entries[0]
                const cityId = canonicalEntry?.id
                const isExpanded = activeCity === city
                const isEditing = cityId ? editingCityId === cityId : false
                const isDeleteLoading = cityId ? isDeletingCity && cityToDelete?.id === cityId : false

                return (
                  <div key={city} className="rounded-lg border border-slate-200 bg-white">
                    <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <button
                        type="button"
                        onClick={() => toggleCity(city)}
                        className="flex flex-1 items-center justify-between gap-3 text-left sm:pr-4"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">{city}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {synonymsForCity.length > 0
                              ? `Альтернативных написаний: ${synonymsForCity.length}`
                              : 'Только основной вариант'}
                          </p>
                        </div>
                        <span className="text-xl text-slate-400">{isExpanded ? '–' : '+'}</span>
                      </button>

                      {cityId && (
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation()
                              handleStartEditCity(cityId, city)
                            }}
                            disabled={isCityUpdating && isEditing}
                          >
                            Редактировать
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={(event) => {
                              event.stopPropagation()
                              handleOpenDeleteCity(cityId, city)
                            }}
                            disabled={isDeleteLoading}
                          >
                            Удалить
                          </Button>
                        </div>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="space-y-3 border-t border-slate-200 px-4 py-4">
                        {isEditing && cityId && (
                          <form
                            onSubmit={(event) => handleSubmitCityEdit(event, cityId, city)}
                            className="flex flex-col gap-2 sm:flex-row sm:items-center"
                          >
                            <Input
                              value={editingCityName}
                              onChange={(event) => setEditingCityName(event.target.value)}
                              disabled={isCityUpdating}
                              className="h-10 flex-1 text-sm"
                              placeholder="Введите новое название"
                            />
                            <div className="flex items-center gap-2">
                              <Button type="submit" size="sm" isLoading={isCityUpdating}>
                                Сохранить
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEditCity}
                                disabled={isCityUpdating}
                              >
                                Отмена
                              </Button>
                            </div>
                          </form>
                        )}

                        {synonymsForCity.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {synonymsForCity.map(entry => (
                              <span
                                key={entry.id}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
                              >
                                {entry.synonym}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSynonym(entry)}
                                  className="rounded-full border border-transparent px-1.5 text-slate-400 transition hover:border-red-400 hover:text-red-500"
                                  disabled={!!deletingMap[entry.id] || isSubmitting}
                                  aria-label="Удалить синоним"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">Добавьте варианты написания, которые встречаются в отчетах.</p>
                        )}

                        <AddSynonymForm city={city} onSynonymAdded={loadSynonyms} />
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Интерактивная карта</CardTitle>
            <CardDescription>Выберите город на схеме, чтобы открыть его карточку в списке.</CardDescription>
          </CardHeader>
          <CardContent>
            <CityMap cities={citySummary} activeCity={activeCity} onSelectCity={handleCitySelect} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Статистика справочника</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex items-baseline justify-between rounded-lg border border-slate-200 px-3 py-2">
              <span className="text-sm text-slate-500">Городов</span>
              <span className="text-lg font-semibold text-slate-900">{stats.totalCities}</span>
            </div>
            <div className="flex items-baseline justify-between rounded-lg border border-slate-200 px-3 py-2">
              <span className="text-sm text-slate-500">Всего записей</span>
              <span className="text-lg font-semibold text-slate-900">{stats.totalSynonyms}</span>
            </div>
            <div className="flex items-baseline justify-between rounded-lg border border-slate-200 px-3 py-2">
              <span className="text-sm text-slate-500">Альтернативных вариантов</span>
              <span className="text-lg font-semibold text-slate-900">{stats.customSynonyms}</span>
            </div>
            <div className="flex items-baseline justify-between rounded-lg border border-slate-200 px-3 py-2">
              <span className="text-sm text-slate-500">Покрытие</span>
              <span className="text-lg font-semibold text-slate-900">{stats.coverage}%</span>
            </div>
          </CardContent>
        </Card>
      </div>
      <ConfirmationModal
        isOpen={!!cityToDelete}
        onClose={handleCloseDeleteCity}
        onConfirm={handleConfirmDeleteCity}
        title="Удалить город"
        message={cityToDelete ? `Город «${cityToDelete.name}» и все связанные синонимы будут удалены. Вы уверены?` : ''}
        isLoading={isDeletingCity}
      />
    </div>
  )
}
