import { DEFAULT_MARKER_PRESET } from '@/lib/constants/cityMarkers'

export type CityCoordinates = {
  lat: number
  lon: number
  markerPreset?: string | null
}

const normaliseCoordinateInput = (value: string) => value.trim().replace(',', '.')

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }

  return null
}

export const normaliseMarkerPreset = (preset?: string | null) => preset ?? DEFAULT_MARKER_PRESET

export const parseCityCoordinates = (value: unknown): CityCoordinates | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const { lat, lon, markerPreset, marker_preset: markerPresetAlt } = value as {
    lat?: unknown
    lon?: unknown
    markerPreset?: unknown
    marker_preset?: unknown
  }

  const latNumber = toNumber(lat)
  const lonNumber = toNumber(lon)

  if (latNumber === null || lonNumber === null) {
    return null
  }

  const preset = typeof markerPreset === 'string'
    ? markerPreset
    : typeof markerPresetAlt === 'string'
      ? markerPresetAlt
      : null

  return {
    lat: latNumber,
    lon: lonNumber,
    markerPreset: preset
  }
}

export const parseManualCoordinatePair = (lat: string, lon: string): Pick<CityCoordinates, 'lat' | 'lon'> | null => {
  const latNumber = toNumber(normaliseCoordinateInput(lat))
  const lonNumber = toNumber(normaliseCoordinateInput(lon))

  if (latNumber === null || lonNumber === null) {
    return null
  }

  return { lat: latNumber, lon: lonNumber }
}
