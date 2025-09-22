'use client'

import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import type { Map as YMap, GeoObjectCollection, Placemark as YPlacemark, Polygon as YPolygon } from 'yandex-maps'
import { getCityGeoEntry, normaliseCityName } from './cityGeo'

interface CityMapProps {
  cities: { name: string; total: number; alternate: number }[]
  activeCity?: string | null
  onSelectCity?: (name: string) => void
}

declare global {
  interface Window {
    ymaps?: typeof ymaps
    __yandexMapsLoadingPromise?: Promise<void>
  }
}

const DEFAULT_CENTER: [number, number] = [61.524, 105.3188]
const DEFAULT_ZOOM = 3.3
const FALLBACK_START: [number, number] = [50, 20]
const FALLBACK_STEP: [number, number] = [2.2, 8]
const FALLBACK_COLUMNS = 4

interface Marker {
  name: string
  total: number
  alternate: number
  coordinates: [number, number]
  approximate: boolean
  zoom: number
  polygon?: [number, number][]
}

const loadYandexMaps = () => {
  if (typeof window === 'undefined') {
    return Promise.resolve()
  }

  if (window.ymaps) {
    return window.ymaps.ready()
  }

  if (!window.__yandexMapsLoadingPromise) {
    window.__yandexMapsLoadingPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU&load=package.standard'
      script.async = true
      script.onload = () => {
        if (window.ymaps) {
          window.ymaps.ready(() => resolve())
        } else {
          resolve()
        }
      }
      script.onerror = () => reject(new Error('Не удалось загрузить скрипт Яндекс.Карт'))
      document.head.appendChild(script)
    })
  }

  return window.__yandexMapsLoadingPromise
}

const CityMapComponent = ({ cities, activeCity, onSelectCity }: CityMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<YMap | null>(null)
  const collectionRef = useRef<GeoObjectCollection | null>(null)
  const polygonRef = useRef<YPolygon | null>(null)
  const placemarksRef = useRef<Map<string, YPlacemark>>(new Map())

  const markers = useMemo<Marker[]>(() => {
    let fallbackIndex = 0

    return cities.map(city => {
      const entry = getCityGeoEntry(city.name)
      let coordinates = entry?.center
      let approximate = false

      if (!coordinates) {
        const column = fallbackIndex % FALLBACK_COLUMNS
        const row = Math.floor(fallbackIndex / FALLBACK_COLUMNS)
        coordinates = [
          FALLBACK_START[0] + row * FALLBACK_STEP[0],
          FALLBACK_START[1] + column * FALLBACK_STEP[1]
        ]
        fallbackIndex += 1
        approximate = true
      }

      return {
        name: city.name,
        total: city.total,
        alternate: city.alternate,
        coordinates,
        approximate,
        zoom: entry?.zoom ?? 8,
        polygon: entry?.polygon
      }
    })
  }, [cities])

  const updatePolygon = useCallback(
    (targetCity: string | null) => {
      if (!window.ymaps || !mapRef.current) {
        return
      }

      const ymapsApi = window.ymaps

      if (polygonRef.current) {
        mapRef.current.geoObjects.remove(polygonRef.current)
        polygonRef.current = null
      }

      if (!targetCity) {
        return
      }

      const marker = markers.find(item => normaliseCityName(item.name) === normaliseCityName(targetCity))
      if (!marker || !marker.polygon) {
        return
      }

      const polygon = new ymapsApi.Polygon([marker.polygon], {}, {
        fillColor: '#2563EB33',
        strokeColor: '#2563EB',
        strokeWidth: 2
      })

      mapRef.current.geoObjects.add(polygon)
      polygonRef.current = polygon
    },
    [markers]
  )

  const updateMarkerStyles = useCallback(
    (targetCity: string | null) => {
      placemarksRef.current.forEach((placemark, name) => {
        const isActive =
          targetCity && normaliseCityName(name) === normaliseCityName(targetCity)
        placemark.options.set(
          'preset',
          isActive ? 'islands#redCircleIconWithNumber' : 'islands#blueCircleIconWithNumber'
        )
      })
    },
    []
  )

  const updateMarkers = useCallback(() => {
    if (!window.ymaps || !mapRef.current || !collectionRef.current) {
      return
    }

    const ymapsApi = window.ymaps
    const collection = collectionRef.current

    collection.removeAll()
    placemarksRef.current.forEach(placemark => placemark.events.removeAll())
    placemarksRef.current.clear()

    markers.forEach(marker => {
      const placemark = new ymapsApi.Placemark(
        marker.coordinates,
        {
          iconContent: marker.alternate,
          hintContent: `${marker.name}: всего записей — ${marker.total}`,
          balloonContentHeader: marker.name,
          balloonContentBody: `<p>Всего записей: ${marker.total}</p><p>Альтернативных написаний: ${marker.alternate}</p>` +
            (marker.approximate ? '<p>Расположение указано приблизительно</p>' : ''),
          balloonContentFooter: 'Данные из справочника'
        },
        {
          preset: marker.approximate
            ? 'islands#grayCircleIconWithNumber'
            : 'islands#blueCircleIconWithNumber'
        }
      )

      placemark.events.add('click', () => {
        onSelectCity?.(marker.name)
      })

      collection.add(placemark)
      placemarksRef.current.set(marker.name, placemark)
    })

    if (collection.getLength() > 0) {
      const bounds = collection.getBounds()
      if (bounds && mapRef.current) {
        mapRef.current.setBounds(bounds, {
          checkZoomRange: true,
          duration: 300
        })
      }
    } else {
      mapRef.current?.setCenter(DEFAULT_CENTER, DEFAULT_ZOOM)
    }
  }, [markers, onSelectCity])

  useEffect(() => {
    let isMounted = true
    const placemarkMap = placemarksRef.current

    const initialize = async () => {
      if (!containerRef.current) {
        return
      }

      try {
        await loadYandexMaps()
      } catch (error) {
        console.error(error)
        return
      }

      if (!isMounted || !window.ymaps || !containerRef.current) {
        return
      }

      const map = new window.ymaps.Map(
        containerRef.current,
        {
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          controls: ['zoomControl']
        },
        {
          suppressMapOpenBlock: true
        }
      )

      mapRef.current = map
      collectionRef.current = new window.ymaps.GeoObjectCollection()
      map.geoObjects.add(collectionRef.current)

      updateMarkers()
      updateMarkerStyles(activeCity ?? null)
      updatePolygon(activeCity ?? null)
    }

    initialize()

    return () => {
      isMounted = false
      if (mapRef.current) {
        mapRef.current.destroy()
      }
      mapRef.current = null
      collectionRef.current = null
      polygonRef.current = null
      placemarkMap.forEach(placemark => placemark.events.removeAll())
      placemarkMap.clear()
      placemarksRef.current = new Map()
    }
  }, [activeCity, updateMarkers, updatePolygon, updateMarkerStyles])

  useEffect(() => {
    updateMarkers()
    updateMarkerStyles(activeCity ?? null)
    updatePolygon(activeCity ?? null)
  }, [activeCity, updateMarkerStyles, updateMarkers, updatePolygon])

  useEffect(() => {
    updateMarkerStyles(activeCity ?? null)
    updatePolygon(activeCity ?? null)

    if (!activeCity || !mapRef.current) {
      return
    }

    const marker = markers.find(item => normaliseCityName(item.name) === normaliseCityName(activeCity))
    if (!marker) {
      return
    }

    const targetZoom = Math.max(marker.zoom, 8)

    mapRef.current.setCenter(marker.coordinates, targetZoom, {
      duration: 300
    })
  }, [activeCity, markers, updateMarkerStyles, updatePolygon])

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-lg border border-slate-200">
        <div ref={containerRef} className="h-[360px] w-full" />
        <div className="pointer-events-none absolute left-3 top-3 rounded bg-slate-900/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
          Яндекс.Карты
        </div>
      </div>
      <p className="text-xs text-slate-500">
        Маркеры показывают количество альтернативных написаний. Серый маркер означает, что координаты определены приблизительно.
      </p>
    </div>
  )
}

export const CityMap = memo(CityMapComponent)
