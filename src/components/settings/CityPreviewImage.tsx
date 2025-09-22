import Image from 'next/image'
import { useMemo } from 'react'
import { getCityGeoEntry } from './cityGeo'

interface CityPreviewImageProps {
  city: string
}

const FALLBACK_CENTER: [number, number] = [55.751244, 37.618423]
const FALLBACK_ZOOM = 8
const IMAGE_SIZE = '450,220'

export function CityPreviewImage({ city }: CityPreviewImageProps) {
  const geoEntry = getCityGeoEntry(city)

  const { url, hasAccurateGeometry } = useMemo(() => {
    const center = geoEntry?.center ?? FALLBACK_CENTER
    const zoom = geoEntry?.zoom ?? FALLBACK_ZOOM
    const polygon = geoEntry?.polygon

    const params = new URLSearchParams({
      lang: 'ru_RU',
      l: 'map',
      size: IMAGE_SIZE,
      z: zoom.toString(),
      ll: `${center[1]},${center[0]}`,
      pt: `${center[1]},${center[0]},pm2rdm`
    })

    if (polygon && polygon.length > 2) {
      const polygonParam = polygon.map(point => `${point[1]},${point[0]}`).join(',')
      params.append('pl', `c:2563EB99,f:2563EB44,w:2,${polygonParam}`)
    }

    return {
      url: `https://static-maps.yandex.ru/1.x/?${params.toString()}`,
      hasAccurateGeometry: Boolean(polygon)
    }
  }, [geoEntry])

  const badgeText = hasAccurateGeometry
    ? 'Контур по данным Яндекс.Карт'
    : geoEntry
      ? 'Предпросмотр по данным Яндекс.Карт'
      : 'Приблизительное положение'

  return (
    <div className="relative h-40 w-full overflow-hidden rounded-md border border-slate-200 bg-white">
      <Image
        src={url}
        alt={`Карта города ${city}`}
        fill
        className="object-cover"
        sizes="(max-width: 1024px) 100vw, 320px"
        priority={false}
      />
      <div className="absolute left-2 top-2 rounded bg-slate-900/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
        {badgeText}
      </div>
      {!geoEntry && (
        <div className="absolute bottom-2 left-1/2 w-[90%] -translate-x-1/2 rounded bg-white/90 px-2 py-1 text-center text-[11px] text-slate-600">
          Границы не найдены автоматически. Указан ориентировочный центр города.
        </div>
      )}
    </div>
  )
}
