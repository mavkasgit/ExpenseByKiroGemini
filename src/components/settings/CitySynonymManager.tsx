'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Modal,
  ConfirmationModal,
} from '@/components/ui';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { MarkerPresetPicker } from '@/components/cities/MarkerPresetPicker';
import { CityMarkerIcon } from '@/components/cities/CityMarkerIcon';
import { useToast } from '@/hooks/useToast';
import { getCitySynonyms, createCitySynonym, deleteCitySynonym, deleteCity, updateCityName } from '@/lib/actions/synonyms';
import { updateCityCoordinates } from '@/lib/actions/cities';
import { attachUnrecognizedCity, getUnrecognizedCities, resolveUnrecognizedCity } from '@/lib/actions/unrecognizedCities';
import { syncCitySynonyms } from '@/lib/utils/cityParser';
import type { CitySynonymWithCity, UnrecognizedCity } from '@/types';
import { AddSynonymForm } from './AddSynonymForm';
import { YMaps, Map as YandexMap, Placemark } from '@pbe/react-yandex-maps';
import { DEFAULT_MARKER_PRESET, markerPresetLookup } from '@/lib/constants/cityMarkers';
import { parseCityCoordinates, parseManualCoordinatePair, normaliseMarkerPreset, type CityCoordinates } from '@/lib/utils/cityCoordinates';
import { cn } from '@/lib/utils';

const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return 'неизвестно';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString('ru-RU');
};


type MapState = {
  center: [number, number];
  zoom: number;
};

const DEFAULT_CENTER: [number, number] = [55.751574, 37.573856];
const DEFAULT_ZOOM = 4;

const createDefaultMapState = (): MapState => ({
  center: [...DEFAULT_CENTER] as [number, number],
  zoom: DEFAULT_ZOOM,
});

const normaliseCoordinateInput = (value: string) => value.trim().replace(',', '.');

const coordinatesAreEqual = (a: CityCoordinates | null, b: CityCoordinates | null) => {
  if (!a && !b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  const sameLat = Math.abs(a.lat - b.lat) < 1e-6;
  const sameLon = Math.abs(a.lon - b.lon) < 1e-6;
  const samePreset = normaliseMarkerPreset(a.markerPreset) === normaliseMarkerPreset(b.markerPreset);
  return sameLat && sameLon && samePreset;
};

const extractEventCoordinates = (event: unknown): [number, number] | null => {
  if (!event || typeof (event as { get?: unknown }).get !== 'function') {
    return null;
  }
  const coords = (event as { get: (key: string) => unknown }).get('coords');
  if (!Array.isArray(coords) || coords.length < 2) {
    return null;
  }
  const [lat, lon] = coords as [number, number];
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    return null;
  }
  return [lat, lon];
};

const extractPlacemarkCoordinates = (target: unknown): [number, number] | null => {
  const geometry = (target as { geometry?: { getCoordinates?: () => unknown } })?.geometry;
  if (!geometry || typeof geometry.getCoordinates !== 'function') {
    return null;
  }
  const coords = geometry.getCoordinates();
  if (!Array.isArray(coords) || coords.length < 2) {
    return null;
  }
  const [lat, lon] = coords as [number, number];
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    return null;
  }
  return [lat, lon];
};

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

type CityGroupWithCoordinates = CityGroup & { coordinates: CityCoordinates };

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
  const [unrecognizedCities, setUnrecognizedCities] = useState<UnrecognizedCity[]>([])
  const [isLoadingUnrecognized, setIsLoadingUnrecognized] = useState(false)
  const [selectedUnrecognizedCityId, setSelectedUnrecognizedCityId] = useState<string | null>(null)
  const [selectedAttachCityId, setSelectedAttachCityId] = useState<string | null>(null)
  const [isAttachingUnrecognized, setIsAttachingUnrecognized] = useState(false)
  const [selectedMarkerPreset, setSelectedMarkerPreset] = useState<string>(DEFAULT_MARKER_PRESET)
  const selectedMarkerLabel = useMemo(() => {
    const preset = markerPresetLookup.get(normaliseMarkerPreset(selectedMarkerPreset))
    return preset?.label ?? 'Стандартный маркер'
  }, [selectedMarkerPreset])
  const [markerUpdatingMap, setMarkerUpdatingMap] = useState<Record<string, boolean>>({})
  const { showToast } = useToast()
  const [mapState, setMapState] = useState<MapState>(() => createDefaultMapState())
  const [selectedCoordinates, setSelectedCoordinates] = useState<CityCoordinates | null>(null)
  const [manualLat, setManualLat] = useState('')
  const [manualLon, setManualLon] = useState('')
  const [isSearchingCoordinates, setIsSearchingCoordinates] = useState(false)
  const mapRef = useRef<unknown>(null)
  const overviewMapRef = useRef<unknown>(null)
  const lastGeocodedQuery = useRef('')
  const yandexApiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY

  const formatCityCoordinates = useCallback((coords: CityCoordinates | null) => {
    if (!coords) {
      return 'нет координат'
    }
    return `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`
  }, [])

  const handleSearchKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
    }
  }, [])

  const resetSelection = useCallback(() => {
    setSelectedCoordinates(null)
    setManualLat('')
    setManualLon('')
    setSelectedMarkerPreset(DEFAULT_MARKER_PRESET)
    setMapState(createDefaultMapState())
    lastGeocodedQuery.current = ''
  }, [])

  const focusOnCoordinates = useCallback((coords: CityCoordinates) => {
    setMapState(prev => {
      const nextZoom = Math.max(prev.zoom, 10)
      const instance = mapRef.current as { setCenter?: (center: [number, number], zoom?: number) => void } | null
      instance?.setCenter?.([coords.lat, coords.lon], nextZoom)
      return {
        center: [coords.lat, coords.lon],
        zoom: nextZoom
      }
    })
  }, [])

  const applyCoordinates = useCallback((coords: CityCoordinates) => {
    const preset = normaliseMarkerPreset(coords.markerPreset)
    setSelectedMarkerPreset(preset)
    const nextCoordinates: CityCoordinates = { ...coords, markerPreset: preset }
    setSelectedCoordinates(prev => {
      if (coordinatesAreEqual(prev, nextCoordinates)) {
        return prev
      }
      return nextCoordinates
    })
    setManualLat(coords.lat.toFixed(6))
    setManualLon(coords.lon.toFixed(6))
    focusOnCoordinates(nextCoordinates)
  }, [focusOnCoordinates])

  const applyManualCoordinates = useCallback((options: { silentOnEmpty?: boolean } = {}) => {
    const { silentOnEmpty = false } = options
    const trimmedLat = manualLat.trim()
    const trimmedLon = manualLon.trim()

    if (!trimmedLat || !trimmedLon) {
      if (!silentOnEmpty) {
        showToast('Введите широту и долготу', 'warning')
      }
      return
    }

    const parsed = parseManualCoordinatePair(trimmedLat, trimmedLon)
    if (!parsed) {
      showToast('Введите корректные координаты', 'error')
      return
    }

    applyCoordinates({ ...parsed, markerPreset: selectedMarkerPreset })
  }, [manualLat, manualLon, applyCoordinates, showToast, selectedMarkerPreset])

  const geocodeCity = useCallback(async (query: string, options: { silent?: boolean; force?: boolean } = {}) => {
    const { silent = false, force = false } = options
    const trimmed = query.trim()

    if (!trimmed) {
      if (!silent) {
        showToast('Введите название города', 'warning')
      }
      return null
    }

    if (!yandexApiKey) {
      if (!silent) {
        showToast('API ключ для Яндекс Карт не найден', 'error')
      }
      return null
    }

    if (!force && silent && trimmed === lastGeocodedQuery.current) {
      return null
    }

    setIsSearchingCoordinates(true)
    try {
      const response = await fetch(
        `https://geocode-maps.yandex.ru/1.x/?apikey=${yandexApiKey}&format=json&geocode=${encodeURIComponent(trimmed)}`
      )
      const data = await response.json()
      const geoObjects = data?.response?.GeoObjectCollection?.featureMember ?? []

      if (geoObjects.length === 0) {
        if (!silent) {
          showToast(`Город "${trimmed}" не найден`, 'error')
        }
        return null
      }

      const point = geoObjects[0]?.GeoObject?.Point?.pos as string | undefined
      if (!point) {
        if (!silent) {
          showToast('Не удалось определить координаты города', 'error')
        }
        return null
      }

      const [lonString, latString] = point.split(' ')
      const lat = Number.parseFloat(latString)
      const lon = Number.parseFloat(lonString)

      if (Number.isNaN(lat) || Number.isNaN(lon)) {
        if (!silent) {
          showToast('Получены некорректные координаты города', 'error')
        }
        return null
      }

      const coords: CityCoordinates = { lat, lon, markerPreset: selectedMarkerPreset }
      lastGeocodedQuery.current = trimmed
      applyCoordinates(coords)

      if (!silent) {
        showToast(`Город ${trimmed} найден`, 'success')
      }

      return coords
    } catch (error) {
      console.error('Geocoding API error:', error)
      if (!silent) {
        showToast('Произошла ошибка при поиске города', 'error')
      }
      return null
    } finally {
      setIsSearchingCoordinates(false)
    }
  }, [applyCoordinates, showToast, yandexApiKey, selectedMarkerPreset])

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
            const parsedCoordinates = parseCityCoordinates(record.city?.coordinates ?? null);
            const coordinates = parsedCoordinates
              ? { ...parsedCoordinates, markerPreset: normaliseMarkerPreset(parsedCoordinates.markerPreset) }
              : null;
            return {
              id: Number(record.id),
              cityId,
              cityName,
              synonym: record.synonym,
              coordinates
            } as CitySynonymRecord;
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

  const loadUnrecognizedCities = useCallback(async () => {
    setIsLoadingUnrecognized(true)
    try {
      const result = await getUnrecognizedCities()
      if (result.error) {
        showToast(result.error, 'error')
      } else if (result.success && Array.isArray(result.data)) {
        setUnrecognizedCities(result.data as UnrecognizedCity[])
      }
    } catch (error) {
      console.error('Failed to load unrecognized cities', error)
      showToast('Не удалось загрузить список непознанных городов', 'error')
    } finally {
      setIsLoadingUnrecognized(false)
    }
  }, [showToast])

  const handleRefresh = useCallback(async () => {
    await Promise.all([loadSynonyms(), loadUnrecognizedCities()])
  }, [loadSynonyms, loadUnrecognizedCities])

  useEffect(() => {
    handleRefresh()
  }, [handleRefresh])

  useEffect(() => {
    const trimmed = newCity.trim()
    if (!trimmed) {
      resetSelection()
      return
    }

    const timeoutId = window.setTimeout(() => {
      geocodeCity(trimmed, { silent: true })
    }, 700)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [newCity, geocodeCity, resetSelection])

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

  const citiesWithCoordinates = useMemo<CityGroupWithCoordinates[]>(
    () =>
      groupedSynonyms.filter((group): group is CityGroupWithCoordinates => Boolean(group.coordinates)),
    [groupedSynonyms]
  )

  const selectedUnrecognizedCity = useMemo(() => {
    if (!selectedUnrecognizedCityId) {
      return null
    }
    return unrecognizedCities.find(city => city.id === selectedUnrecognizedCityId) ?? null
  }, [selectedUnrecognizedCityId, unrecognizedCities])

  useEffect(() => {
    if (selectedUnrecognizedCityId && !selectedUnrecognizedCity) {
      setSelectedUnrecognizedCityId(null)
      setSelectedAttachCityId(null)
    }
  }, [selectedUnrecognizedCityId, selectedUnrecognizedCity])

  const citySelectionOptions = useMemo(
    () =>
      groupedSynonyms.map(group => ({
        value: group.cityId,
        label: group.cityName,
      })),
    [groupedSynonyms]
  )

  const unrecognizedCityOptions = useMemo(
    () =>
      unrecognizedCities.map(city => ({
        value: city.id,
        label: city.frequency ? `${city.name} · ${city.frequency}` : city.name,
      })),
    [unrecognizedCities]
  )

  const overviewMapState = useMemo<MapState>(() => {
    if (citiesWithCoordinates.length === 0) {
      return createDefaultMapState()
    }

    const first = citiesWithCoordinates[0].coordinates
    return {
      center: [first.lat, first.lon],
      zoom: citiesWithCoordinates.length === 1 ? 9 : DEFAULT_ZOOM
    }
  }, [citiesWithCoordinates])

  useEffect(() => {
    if (citiesWithCoordinates.length === 0) {
      return
    }

    const instance = overviewMapRef.current as {
      setBounds?: (bounds: [[number, number], [number, number]], options?: { checkZoomRange?: boolean; zoomMargin?: number }) => void
      setCenter?: (center: [number, number], zoom?: number) => void
    } | null

    if (!instance) {
      return
    }

    if (citiesWithCoordinates.length === 1) {
      const coords = citiesWithCoordinates[0].coordinates
      instance.setCenter?.([coords.lat, coords.lon], 9)
      return
    }

    const latitudes = citiesWithCoordinates.map(city => city.coordinates.lat)
    const longitudes = citiesWithCoordinates.map(city => city.coordinates.lon)
    const bounds: [[number, number], [number, number]] = [
      [Math.min(...latitudes), Math.min(...longitudes)],
      [Math.max(...latitudes), Math.max(...longitudes)]
    ]

    instance.setBounds?.(bounds, { checkZoomRange: true, zoomMargin: 32 })
  }, [citiesWithCoordinates])

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

  const handleSelectUnrecognizedCity = useCallback((value: string | null) => {
    setSelectedUnrecognizedCityId(value)
    setSelectedAttachCityId(null)
  }, [])

  const handleUseUnrecognizedCity = useCallback(() => {
    if (!selectedUnrecognizedCity) {
      showToast('Выберите город из списка непознанных', 'warning')
      return
    }
    setNewCity(selectedUnrecognizedCity.name)
    geocodeCity(selectedUnrecognizedCity.name, { silent: true, force: true })
  }, [geocodeCity, selectedUnrecognizedCity, showToast])

  const handleClearUnrecognizedSelection = useCallback(() => {
    setSelectedUnrecognizedCityId(null)
    setSelectedAttachCityId(null)
  }, [])

  const handleAttachUnrecognizedCity = useCallback(async () => {
    if (!selectedUnrecognizedCityId || !selectedAttachCityId) {
      showToast('Выберите непознанный город и основной город для привязки', 'warning')
      return
    }

    setIsAttachingUnrecognized(true)
    try {
      const result = await attachUnrecognizedCity({
        unrecognizedCityId: selectedUnrecognizedCityId,
        cityId: selectedAttachCityId,
      })
      if (result.error) {
        showToast(result.error, 'error')
        return
      }

      showToast('Альтернативное название добавлено', 'success')
      handleClearUnrecognizedSelection()
      await Promise.all([loadSynonyms(), loadUnrecognizedCities()])
    } catch (error) {
      console.error('Failed to attach unrecognized city', error)
      showToast('Не удалось прикрепить альтернативное название', 'error')
    } finally {
      setIsAttachingUnrecognized(false)
    }
  }, [handleClearUnrecognizedSelection, loadSynonyms, loadUnrecognizedCities, selectedAttachCityId, selectedUnrecognizedCityId, showToast])

  const handleMarkerPresetChange = useCallback(async (cityId: string, preset: string) => {
    const targetPreset = normaliseMarkerPreset(preset)
    const recordWithCoordinates = synonyms.find(record => record.cityId === cityId && record.coordinates)?.coordinates

    if (!recordWithCoordinates) {
      showToast('Сначала задайте координаты города, затем выбирайте маркер', 'warning')
      return
    }

    const nextCoordinates: CityCoordinates = { ...recordWithCoordinates, markerPreset: targetPreset }
    const matchesSelected =
      selectedCoordinates != null &&
      Math.abs(selectedCoordinates.lat - recordWithCoordinates.lat) < 1e-6 &&
      Math.abs(selectedCoordinates.lon - recordWithCoordinates.lon) < 1e-6

    setMarkerUpdatingMap(prev => ({ ...prev, [cityId]: true }))
    try {
      const result = await updateCityCoordinates({ id: cityId, coordinates: nextCoordinates })
      if (result?.error) {
        showToast(result.error, 'error')
        return
      }

      setSynonyms(prev =>
        prev.map(record =>
          record.cityId === cityId && record.coordinates
            ? { ...record, coordinates: { ...record.coordinates, markerPreset: targetPreset } }
            : record
        )
      )

      if (matchesSelected) {
        setSelectedMarkerPreset(targetPreset)
        setSelectedCoordinates(prev => (prev ? { ...prev, markerPreset: targetPreset } : prev))
      }

      showToast('Маркер города обновлён', 'success')
    } catch (error) {
      console.error('Failed to update marker preset', error)
      showToast('Не удалось обновить маркер города', 'error')
    } finally {
      setMarkerUpdatingMap(prev => ({ ...prev, [cityId]: false }))
    }
  }, [selectedCoordinates, showToast, synonyms])

  const handleCityNameClick = useCallback((group: CityGroup) => {
    if (group.coordinates) {
      applyCoordinates({ ...group.coordinates, markerPreset: normaliseMarkerPreset(group.coordinates.markerPreset) })
      return
    }

    showToast('Координаты не найдены, выполняем поиск на карте…', 'info')
    geocodeCity(group.cityName, { force: true })
  }, [applyCoordinates, geocodeCity, showToast])

  const handleNewCityMarkerPresetChange = useCallback((value: string) => {
    const preset = normaliseMarkerPreset(value)
    setSelectedMarkerPreset(preset)
    setSelectedCoordinates(prev => (prev ? { ...prev, markerPreset: preset } : prev))
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newCity.trim()) {
      showToast('Заполните название города', 'error')
      return
    }

    if (!selectedCoordinates) {
      showToast('Подтвердите координаты города', 'error')
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
        const parsedServerCoordinates = parseCityCoordinates(payload.city?.coordinates ?? null)
        const serverCoordinates = parsedServerCoordinates
          ? { ...parsedServerCoordinates, markerPreset: normaliseMarkerPreset(parsedServerCoordinates.markerPreset) }
          : null
        let effectiveCoordinates: CityCoordinates | null = selectedCoordinates

        if (createdCityId && !coordinatesAreEqual(selectedCoordinates, serverCoordinates)) {
          const updateResult = await updateCityCoordinates({ id: createdCityId, coordinates: selectedCoordinates })
          if (updateResult?.error) {
            showToast(updateResult.error, 'error')
            effectiveCoordinates = serverCoordinates
          }
        }

        if (!createdCityId) {
          await loadSynonyms()
        } else {
          setSynonyms(prev => {
            const newRecord: CitySynonymRecord = {
              id: Number(payload.id),
              cityId: createdCityId,
              cityName: createdCityName,
              synonym: payload.synonym,
              coordinates:
                effectiveCoordinates ??
                (serverCoordinates
                  ? { ...serverCoordinates, markerPreset: normaliseMarkerPreset(serverCoordinates.markerPreset) }
                  : null)
            }
            const updated = [...prev, newRecord]
            syncCitySynonyms(updated.map(record => ({ city: record.cityName, synonym: record.synonym })))
            return updated
          })
        }
        if (selectedUnrecognizedCityId) {
          const resolveResult = await resolveUnrecognizedCity({ id: selectedUnrecognizedCityId })
          if (resolveResult?.error) {
            showToast(resolveResult.error, 'error')
          } else {
            handleClearUnrecognizedSelection()
          }
          await loadUnrecognizedCities()
        }

        showToast('Город добавлен', 'success')
        setNewCity('')
        resetSelection()
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

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)]">
        <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle>Справочник городов</CardTitle>
                  <CardDescription>
                    Рабочая область для управления городами и их альтернативными написаниями.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isLoading || isLoadingUnrecognized}
                  className="self-start lg:self-auto"
                >
                  Обновить
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                <div className="space-y-5">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Неопознанные города
                      </span>
                      <SearchableSelect
                        options={unrecognizedCityOptions}
                        value={selectedUnrecognizedCityId}
                        onChange={handleSelectUnrecognizedCity}
                        placeholder={isLoadingUnrecognized ? 'Загружаем список…' : 'Выберите город из расходов'}
                        className="w-full"
                        disabled={isLoadingUnrecognized || isSubmitting}
                        maxVisibleOptions={3}
                        forceOpen
                      />
                      <p className="text-xs text-slate-500">
                        Список городов, найденных в выписках, отображается тремя первыми значениями. Раскройте его, чтобы увидеть полный перечень.
                      </p>
                    </div>
                    {selectedUnrecognizedCity && (
                      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-700">
                          <div className="space-y-1">
                            <p className="font-medium text-slate-900">{selectedUnrecognizedCity.name}</p>
                            <p className="text-xs text-slate-500">
                              Всего упоминаний: {selectedUnrecognizedCity.frequency ?? '—'} · Последний раз: {formatDate(selectedUnrecognizedCity.last_seen)}
                            </p>
                          </div>
                          <Button type="button" variant="ghost" size="sm" onClick={handleClearUnrecognizedSelection}>
                            Сбросить
                          </Button>
                        </div>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleUseUnrecognizedCity}
                            disabled={isSubmitting}
                            className="lg:self-start"
                          >
                            Использовать как новый город
                          </Button>
                          <div className="flex flex-1 flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Прикрепить как альтернативный вариант
                            </span>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                              <SearchableSelect
                                options={citySelectionOptions}
                                value={selectedAttachCityId}
                                onChange={value => setSelectedAttachCityId(value)}
                                placeholder="Выберите основной город"
                                size="sm"
                                disabled={isAttachingUnrecognized}
                                className="w-full sm:flex-1"
                                maxVisibleOptions={3}
                              />
                              <Button
                                type="button"
                                onClick={handleAttachUnrecognizedCity}
                                isLoading={isAttachingUnrecognized}
                                disabled={isAttachingUnrecognized || !selectedAttachCityId}
                              >
                                Прикрепить
                              </Button>
                            </div>
                            <p className="text-xs text-slate-500">
                              Альтернативное название будет добавлено к выбранному городу, а запись исчезнет из списка неопознанных.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="synonym-city">
                        Новый город
                      </label>
                      <div className="relative">
                        <Input
                          id="synonym-city"
                          placeholder="Например: Санкт-Петербург"
                          value={newCity}
                          onChange={(event) => setNewCity(event.target.value)}
                          disabled={isSubmitting}
                          className="h-11 pl-12"
                        />
                        <MarkerPresetPicker
                          value={selectedMarkerPreset}
                          onChange={handleNewCityMarkerPresetChange}
                          disabled={isSubmitting}
                          align="start"
                          triggerClassName="absolute inset-y-0 left-0 flex h-full w-10 items-center justify-center rounded-l-md border-0 bg-transparent text-slate-500 transition hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-0"
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        Маркер: {selectedMarkerLabel}. Этот маркер будет использоваться для отображения города на карте.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <p className="text-xs text-slate-500">
                        Укажите название и подтвердите координаты перед сохранением.
                      </p>
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => geocodeCity(newCity, { force: true })}
                          isLoading={isSearchingCoordinates}
                          disabled={!newCity.trim() || isSubmitting}
                        >
                          Найти на карте
                        </Button>
                        <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting || !selectedCoordinates}>
                          Добавить город
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Подтверждение координат</p>
                    <div className="h-72 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                      {yandexApiKey ? (
                        <YMaps query={{ apikey: yandexApiKey, lang: 'ru_RU' }}>
                          <YandexMap
                            state={mapState}
                            width="100%"
                            height="100%"
                            modules={['geoObject.addon.balloon', 'geoObject.addon.hint']}
                            instanceRef={(ref) => {
                              mapRef.current = ref ?? null
                            }}
                            onClick={(event: unknown) => {
                              const coords = extractEventCoordinates(event)
                              if (!coords) {
                                return
                              }
                              const [lat, lon] = coords
                              applyCoordinates({ lat, lon, markerPreset: selectedMarkerPreset })
                            }}
                          >
                            {selectedCoordinates && (
                              <Placemark
                                geometry={[selectedCoordinates.lat, selectedCoordinates.lon]}
                                options={{ draggable: true, preset: selectedCoordinates.markerPreset ?? DEFAULT_MARKER_PRESET }}
                                onDragEnd={(event: { get: (key: string) => unknown }) => {
                                  const coords = extractPlacemarkCoordinates(event.get('target'))
                                  if (!coords) {
                                    return
                                  }
                                  const [lat, lon] = coords
                                  applyCoordinates({ lat, lon, markerPreset: selectedMarkerPreset })
                                }}
                              />
                            )}
                          </YandexMap>
                        </YMaps>
                      ) : (
                        <div className="flex h-full items-center justify-center px-4 text-center text-sm text-red-700">
                          API-ключ для Яндекс Карт не настроен. Укажите координаты вручную.
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">Нажмите на карту или перетащите маркер, чтобы уточнить координаты.</p>
                  </div>

                  <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-sm font-medium text-slate-900">Ручной ввод координат</p>
                    <div className="grid gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="manual-lat">
                          Широта (lat)
                        </label>
                        <Input
                          id="manual-lat"
                          value={manualLat}
                          onChange={(event) => setManualLat(normaliseCoordinateInput(event.target.value))}
                          onBlur={() => applyManualCoordinates({ silentOnEmpty: true })}
                          inputMode="decimal"
                          placeholder="Например: 59.9386"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="manual-lon">
                          Долгота (lon)
                        </label>
                        <Input
                          id="manual-lon"
                          value={manualLon}
                          onChange={(event) => setManualLon(normaliseCoordinateInput(event.target.value))}
                          onBlur={() => applyManualCoordinates({ silentOnEmpty: true })}
                          inputMode="decimal"
                          placeholder="Например: 30.3141"
                        />
                      </div>
                    </div>
                    <Button type="button" variant="secondary" onClick={() => applyManualCoordinates()} disabled={isSubmitting}>
                      Применить координаты
                    </Button>
                    <p className="text-xs text-slate-500">
                      Если автоматический поиск не помог, введите координаты вручную и нажмите «Применить».
                    </p>
                  </div>
                </div>
              </form>

              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="city-search">
                    Поиск по списку городов
                  </label>
                  <div className="relative">
                    <Input
                      id="city-search"
                      placeholder="Поиск по городу или синониму"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      className="pl-9"
                      type="search"
                    />
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">🔍</span>
                  </div>
                  <p className="text-xs text-slate-500">Найдите город в существующем списке для редактирования или удаления.</p>
                </div>

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
                    const markerLabel = markerPresetLookup.get(normaliseMarkerPreset(group.coordinates?.markerPreset))?.label;
                    const isMarkerUpdating = Boolean(markerUpdatingMap[group.cityId]);

                    return (
                      <div key={group.cityId} className="rounded-lg border border-slate-200 bg-white">
                        <div className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                {hasCoordinates ? (
                                  <MarkerPresetPicker
                                    value={group.coordinates?.markerPreset ?? DEFAULT_MARKER_PRESET}
                                    onChange={(value) => handleMarkerPresetChange(group.cityId, value)}
                                    disabled={isMarkerUpdating || isSubmitting}
                                    triggerClassName="inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent bg-slate-100 text-slate-600 transition hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-0"
                                  />
                                ) : (
                                  <span className="flex items-center justify-center rounded-full bg-slate-100 p-1" title={coordinatesHint}>
                                    <CityMarkerIcon active={false} preset={group.coordinates?.markerPreset} />
                                    <span className="sr-only">{coordinatesHint}</span>
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleCityNameClick(group)}
                                  className="rounded px-1 text-left text-sm font-medium text-slate-900 transition hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                                >
                                  {canonicalName}
                                  <span className="ml-2 text-xs font-normal text-slate-500">
                                    ({formatCityCoordinates(group.coordinates ?? null)})
                                  </span>
                                </button>
                              </div>
                              <p className="text-xs text-slate-500">
                                {synonymsForCity.length > 0
                                  ? `Альтернативных написаний: ${synonymsForCity.length}`
                                  : 'Только основной вариант'}
                              </p>
                            </div>
                            <div className="w-full max-w-xs space-y-1">
                              <p className={cn('text-[11px]', hasCoordinates ? 'text-slate-500' : 'text-amber-600')}>
                                {hasCoordinates
                                  ? isMarkerUpdating
                                    ? 'Обновляем маркер…'
                                    : markerLabel
                                      ? `Маркер: ${markerLabel}`
                                      : 'Используется стандартный маркер'
                                  : 'Сначала задайте координаты, чтобы выбрать маркер.'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
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

          <div className="space-y-3">
            <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Карта всех городов</p>
              <div className="h-[420px] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                {yandexApiKey ? (
                  citiesWithCoordinates.length > 0 ? (
                    <YMaps query={{ apikey: yandexApiKey, lang: 'ru_RU' }}>
                      <YandexMap
                        state={overviewMapState}
                        width="100%"
                        height="100%"
                        modules={['geoObject.addon.balloon', 'geoObject.addon.hint']}
                        instanceRef={(ref) => {
                          overviewMapRef.current = ref ?? null
                        }}
                      >
                        {citiesWithCoordinates.map(city => (
                          <Placemark
                            key={city.cityId}
                            geometry={[city.coordinates.lat, city.coordinates.lon]}
                            properties={{
                              balloonContent: `<strong>${city.cityName}</strong><br/>${formatCityCoordinates(city.coordinates)}`,
                              hintContent: `${city.cityName} (${formatCityCoordinates(city.coordinates)})`
                            }}
                            options={{ preset: city.coordinates.markerPreset ?? DEFAULT_MARKER_PRESET }}
                          />
                        ))}
                      </YandexMap>
                    </YMaps>
                  ) : (
                    <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-500">
                      Для отображения на карте добавьте координаты городов.
                    </div>
                  )
                ) : (
                  <div className="flex h-full items-center justify-center px-4 text-center text-sm text-red-700">
                    API-ключ для Яндекс Карт не настроен. Карта городов недоступна.
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500">На карте отображаются все города с заданными координатами.</p>
            </div>
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
