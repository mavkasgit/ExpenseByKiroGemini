'use client'

import { markerPresetLookup } from '@/lib/constants/cityMarkers'
import { normaliseMarkerPreset } from '@/lib/utils/cityCoordinates'
import { cn } from '@/lib/utils'

interface CityMarkerIconProps {
  preset?: string | null
  active?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeToClass: Record<NonNullable<CityMarkerIconProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6'
}

export function CityMarkerIcon({
  preset,
  active = true,
  className,
  size = 'sm'
}: CityMarkerIconProps) {
  const normalisedPreset = normaliseMarkerPreset(preset)
  const marker = markerPresetLookup.get(normalisedPreset)
  const color = marker?.color ?? (active ? '#0EA5E9' : '#94A3B8')

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn(sizeToClass[size], 'shrink-0 transition', className)}
      style={{ color }}
    >
      <path
        d="M12 2.25a6.25 6.25 0 0 0-6.25 6.25c0 4.69 5.15 11.06 5.37 11.32a1 1 0 0 0 1.76 0c.22-.26 5.37-6.63 5.37-11.32A6.25 6.25 0 0 0 12 2.25Zm0 8.75a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"
        fill="currentColor"
      />
    </svg>
  )
}
