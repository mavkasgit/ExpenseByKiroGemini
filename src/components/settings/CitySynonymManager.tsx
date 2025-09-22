'use client'

import { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Modal, ConfirmationModal } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { getCitySynonyms, createCitySynonym, deleteCitySynonym, deleteCity, updateCityName } from '@/lib/actions/synonyms';
import { updateCityCoordinates } from '@/lib/actions/cities';
import { syncCitySynonyms } from '@/lib/utils/cityParser';
import type { CitySynonymWithCity } from '@/types';
import { AddSynonymForm } from './AddSynonymForm';
import { CityMap } from './CityMap';

type CityCoordinates = { lat: number; lon: number };

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return null;
};

const parseCoordinates = (value: unknown): CityCoordinates | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const { lat, lon } = value as { lat?: unknown; lon?: unknown };
  const latNumber = toNumber(lat);
  const lonNumber = toNumber(lon);

  if (latNumber === null || lonNumber === null) {
    return null;
  }

  return { lat: latNumber, lon: lonNumber };
};

const MapPinMini = ({ active }: { active: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={clsx('h-4 w-4 transition', active ? 'text-sky-500' : 'text-slate-400')}
  >
    <path
      d="M12 2.25a6.25 6.25 0 0 0-6.25 6.25c0 4.69 5.15 11.06 5.37 11.32a1 1 0 0 0 1.76 0c.22-.26 5.37-6.63 5.37-11.32A6.25 6.25 0 0 0 12 2.25Zm0 8.75a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"
      fill="currentColor"
    />
  </svg>
);

interface CitySummary {
  id: string;
  name: string;
  total: number;
  alternate: number;
  coordinates: CityCoordinates | null;
}

interface CitySynonymRecord {
  id: number;
  cityId: string;
  cityName: string;
  synonym: string;
  coordinates: CityCoordinates | null;
}

type CityGroup = {
  cityId: string;
  cityName: string;
  entries: CitySynonymRecord[];
  coordinates: CityCoordinates | null;
};

export function CitySynonymManager() {
  const [synonyms, setSynonyms] = useState<CitySynonymRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newCity, setNewCity] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingMap, setDeletingMap] = useState<Record<string, boolean>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [cityToDelete, setCityToDelete] = useState<{ id: string; name: string } | null>(null)
  const [cityToEdit, setCityToEdit] = useState<{ id: string; name: string } | null>(null)
  const [newCityName, setNewCityName] = useState('')
  const [isGeocoding, setIsGeocoding] = useState<string | null>(null);
  const { showToast } = useToast()

  const loadSynonyms = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getCitySynonyms()
      if (result.error) {
        showToast(result.error, 'error')
      } else if (result.success && result.data) {
        const records = (result.data as CitySynonymWithCity[])
          .map((record) => {
            const cityId = record.city?.id ?? record.city_id;
            const cityName = record.city?.name ?? record.synonym;
            if (!cityId) {
              return null;
            }
            const coordinates = parseCoordinates(record.city?.coordinates ?? null);
            return {
              id: Number(record.id),
              cityId,
              cityName,
              synonym: record.synonym,
              coordinates
            } satisfies CitySynonymRecord;
          })
          .filter((record): record is CitySynonymRecord => record !== null)

        setSynonyms(records)
        syncCitySynonyms(records.map(record => ({ city: record.cityName, synonym: record.synonym })))
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
    const map = new Map<string, CityGroup>()

    synonyms.forEach(record => {
      const groupKey = record.cityId
      if (!groupKey) {
        return
      }
      if (!map.has(groupKey)) {
        map.set(groupKey, {
          cityId: groupKey,
          cityName: record.cityName,
          entries: [],
          coordinates: record.coordinates
        })
      }
      const group = map.get(groupKey)!
      group.entries.push(record)
      if (!group.cityName && record.cityName) {
        group.cityName = record.cityName
      }
      if (!group.coordinates && record.coordinates) {
        group.coordinates = record.coordinates
      }
    })

    return Array.from(map.values()).sort((a, b) => a.cityName.localeCompare(b.cityName, 'ru'))
  }, [synonyms])

  const filteredGroupedSynonyms = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) {
      return groupedSynonyms
    }

    return groupedSynonyms.filter(group => {
      if (group.cityName.toLowerCase().includes(term)) {
        return true
      }
      return group.entries.some(entry => entry.synonym.toLowerCase().includes(term))
    })
  }, [groupedSynonyms, searchTerm])

  const stats = useMemo(() => {
    const totalCities = groupedSynonyms.length
    const citiesWithCustomSynonyms = groupedSynonyms.filter(group =>
      group.entries.some(entry => entry.synonym.trim() && entry.synonym.trim().toLowerCase() !== group.cityName.trim().toLowerCase())
    ).length
    const totalSynonyms = synonyms.length
    const customSynonyms = synonyms.filter(entry => entry.synonym.trim().toLowerCase() !== entry.cityName.trim().toLowerCase()).length
    const coverage = totalCities === 0 ? 0 : Math.round((citiesWithCustomSynonyms / totalCities) * 100)

    return {
      totalCities,
      totalSynonyms,
      customSynonyms,
      coverage
    }
  }, [groupedSynonyms, synonyms])

  const citySummary: CitySummary[] = useMemo(() => {
    return filteredGroupedSynonyms.map(group => {
      const alternate = group.entries.filter(entry => entry.synonym.trim().toLowerCase() !== group.cityName.trim().toLowerCase()).length;
      return {
        id: group.cityId,
        name: group.cityName,
        total: group.entries.length,
        alternate,
        coordinates: group.coordinates ?? null
      } satisfies CitySummary;
    });
  }, [filteredGroupedSynonyms]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newCity.trim()) {
      showToast('Заполните название города', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const cityName = newCity.trim()
      const result = await createCitySynonym({ city: cityName, synonym: cityName })
      if (result.error) {
        showToast(result.error, 'error')
      } else if (result.success && result.data) {
        const payload = result.data as CitySynonymWithCity
        const createdCityId = payload.city?.id ?? payload.city_id
        const createdCityName = payload.city?.name ?? cityName

        if (!createdCityId) {
          await loadSynonyms()
        } else {
          setSynonyms(prev => {
            const newRecord: CitySynonymRecord = {
              id: Number(payload.id),
              cityId: createdCityId,
              cityName: createdCityName,
              synonym: payload.synonym,
              coordinates: parseCoordinates(payload.city?.coordinates ?? null)
            }
            const updated = [...prev, newRecord]
            syncCitySynonyms(updated.map(record => ({ city: record.cityName, synonym: record.synonym })))
            return updated
          })
        }
        showToast('Город добавлен', 'success')
        setNewCity('')
      }
    } catch (error) {
      console.error('Failed to create city', error)
      showToast('Не удалось добавить город', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSynonym = async (synonym: CitySynonymRecord) => {
    const key = synonym.id.toString()
    setDeletingMap(prev => ({ ...prev, [key]: true }))
    try {
      const result = await deleteCitySynonym({ id: synonym.id })
      if (result.error) {
        showToast(result.error, 'error')
      } else {
        setSynonyms(prev => {
          const updated = prev.filter(item => item.id !== synonym.id)
          syncCitySynonyms(updated.map(record => ({ city: record.cityName, synonym: record.synonym })))
          return updated
        })
        showToast('Синоним удален', 'success')
      }
    } catch (error) {
      console.error('Failed to delete city synonym', error)
      showToast('Не удалось удалить синоним', 'error')
    } finally {
      setDeletingMap(prev => ({ ...prev, [key]: false }))
    }
  }

  const handleDeleteClick = (e: React.MouseEvent, city: { id: string; name: string }) => {
    e.stopPropagation();
    setCityToDelete(city);
  };

  const handleConfirmDelete = async () => {
    if (!cityToDelete) return;

    setIsSubmitting(true);
    try {
      const result = await deleteCity({ id: cityToDelete.id });
      if (result.error) {
        showToast(result.error, 'error');
      } else {
        setSynonyms(prev => {
          const updated = prev.filter(s => s.cityId !== cityToDelete.id);
          syncCitySynonyms(updated.map(record => ({ city: record.cityName, synonym: record.synonym })));
          return updated;
        });
        showToast('Город и все его синонимы удалены', 'success');
      }
    } catch (error) {
      console.error('Failed to delete city', error);
      showToast('Не удалось удалить город', 'error');
    } finally {
      setIsSubmitting(false);
      setCityToDelete(null);
    }
  };

  const handleEditClick = (e: React.MouseEvent, city: { id: string; name: string }) => {
    e.stopPropagation();
    setCityToEdit(city);
    setNewCityName(city.name);
  };

  const handleConfirmEdit = async () => {
    if (!cityToEdit || !newCityName.trim() || cityToEdit.name === newCityName.trim()) {
      setCityToEdit(null);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateCityName({ id: cityToEdit.id, newCityName: newCityName.trim() });
      if (result.error) {
        showToast(result.error, 'error');
      } else {
        const trimmedName = newCityName.trim();
        setSynonyms(prev => {
          const updated = prev.map(s => {
            if (s.cityId !== cityToEdit.id) {
              return s;
            }
            const isCanonical = s.synonym.trim().toLowerCase() === cityToEdit.name.trim().toLowerCase();
            return {
              ...s,
              cityName: trimmedName,
              synonym: isCanonical ? trimmedName : s.synonym
            };
          });
          syncCitySynonyms(updated.map(record => ({ city: record.cityName, synonym: record.synonym })));
          return updated;
        });
        showToast('Название города обновлено', 'success');
      }
    } catch (error) {
      console.error('Failed to edit city', error);
      showToast('Не удалось изменить город', 'error');
    } finally {
      setIsSubmitting(false);
      setCityToEdit(null);
      setNewCityName('');
    }
  };

  const handleGeocodeClick = async (cityId: string, cityName: string) => {
    setIsGeocoding(cityId);
    const YANDEX_API_KEY = process.env.NEXT_PUBLIC_YANDEX_GEOCODER_API_KEY;
    if (!YANDEX_API_KEY) {
      showToast('Не найден ключ API для Яндекс.Карт', 'error');
      setIsGeocoding(null);
      return;
    }

    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_API_KEY}&format=json&geocode=${encodeURIComponent(cityName)}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      const featureMember = data.response.GeoObjectCollection.featureMember;
      if (featureMember.length > 0) {
        const point = featureMember[0].GeoObject.Point.pos;
        const [lon, lat] = point.split(' ').map(Number);
        
        const result = await updateCityCoordinates({ id: cityId, coordinates: { lat, lon } });
        if (result.error) {
          showToast(result.error, 'error');
        } else {
          showToast('Координаты успешно обновлены', 'success');
          loadSynonyms(); // Reload data to show new coordinates if displayed
        }
      } else {
        showToast('Не удалось найти координаты для этого города', 'error');
      }
    } catch (error) {
      console.error(`Error geocoding city "${cityName}":`, error);
      showToast('Ошибка при поиске координат', 'error');
    } finally {
      setIsGeocoding(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Интерактивная карта</CardTitle>
            <CardDescription>Выберите город на схеме, чтобы открыть его карточку в списке.</CardDescription>
          </CardHeader>
          <CardContent>
            <CityMap cities={citySummary} />
          </CardContent>
        </Card>

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
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Input
                      placeholder="Поиск по городу или синониму"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      className="pl-9"
                    />
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">🔍</span>
                  </div>
                  <Button type="button" variant="outline" onClick={loadSynonyms} disabled={isLoading}>
                    Обновить
                  </Button>
                </div>
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
                    value={newCity}
                    onChange={(event) => setNewCity(event.target.value)}
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
                ) : filteredGroupedSynonyms.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    Ничего не найдено. Проверьте запрос или добавьте новый город.
                  </div>
                ) : (
                  filteredGroupedSynonyms.map(group => {
                    const canonicalName = group.cityName;
                    const synonymsForCity = group.entries.filter(entry => entry.synonym.trim().toLowerCase() !== canonicalName.trim().toLowerCase());
                    const hasCoordinates = Boolean(group.coordinates);
                    const coordinatesHint = hasCoordinates ? 'Город отображается на карте' : 'Координаты не определены';

                    return (
                      <div key={group.cityId} className="rounded-lg border border-slate-200 bg-white">
                        <div className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center" title={coordinatesHint}>
                                <MapPinMini active={hasCoordinates} />
                                <span className="sr-only">{coordinatesHint}</span>
                              </span>
                              <p className="text-sm font-medium text-slate-900">{canonicalName}</p>
                            </div>
                            <p className="text-xs text-slate-500">
                              {synonymsForCity.length > 0
                                ? `Альтернативных написаний: ${synonymsForCity.length}`
                                : 'Только основной вариант'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => group.cityId && handleGeocodeClick(group.cityId, canonicalName)} isLoading={isGeocoding === group.cityId} disabled={!group.cityId}>
                              Координаты
                            </Button>
                            <Button variant="outline" size="sm" onClick={(e) => group.cityId && handleEditClick(e, { id: group.cityId, name: canonicalName })} disabled={!group.cityId}>
                              Редактировать
                            </Button>
                            <Button variant="danger" size="sm" onClick={(e) => group.cityId && handleDeleteClick(e, { id: group.cityId, name: canonicalName })} disabled={!group.cityId}>
                              Удалить
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3 border-t border-slate-200 px-4 py-4">
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
                                    disabled={!!deletingMap[entry.id.toString()] || isSubmitting}
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

                          <AddSynonymForm cityId={group.cityId} cityName={canonicalName} onSynonymAdded={loadSynonyms} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
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
      </div>
      <ConfirmationModal
        isOpen={!!cityToDelete}
        onClose={() => setCityToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={`Удалить город ${cityToDelete?.name}?`}
        message="Это действие приведет к удалению города и всех связанных с ним синонимов. Отменить это действие будет невозможно."
        confirmText="Удалить"
        isLoading={isSubmitting}
      />
      <Modal isOpen={!!cityToEdit} onClose={() => setCityToEdit(null)} title={`Редактировать город ${cityToEdit?.name}`}>
        <div className="space-y-4 p-6">
          <Input
            value={newCityName}
            onChange={(e) => setNewCityName(e.target.value)}
            placeholder="Новое название города"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCityToEdit(null)}>Отмена</Button>
            <Button onClick={handleConfirmEdit} isLoading={isSubmitting}>Сохранить</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
