'use client'

import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { CityMarkerIcon } from '@/components/cities/CityMarkerIcon'
import { MARKER_PRESETS, markerPresetLookup } from '@/lib/constants/cityMarkers'
import { normaliseMarkerPreset } from '@/lib/utils/cityCoordinates'
import { cn } from '@/lib/utils'

interface MarkerPresetPickerProps {
  value?: string | null
  onChange: (value: string) => void
  disabled?: boolean
  triggerClassName?: string
  align?: 'start' | 'center' | 'end'
}

export function MarkerPresetPicker({
  value,
  onChange,
  disabled = false,
  triggerClassName,
  align = 'start'
}: MarkerPresetPickerProps) {
  const [open, setOpen] = useState(false)

  const selectedPreset = normaliseMarkerPreset(value)
  const marker = markerPresetLookup.get(selectedPreset)

  const handleSelect = (preset: string) => {
    onChange(preset)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={(nextOpen) => !disabled && setOpen(nextOpen)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
            disabled && 'cursor-not-allowed opacity-60',
            triggerClassName
          )}
          aria-label={marker ? `Маркер: ${marker.label}` : 'Выбрать маркер'}
          disabled={disabled}
        >
          <CityMarkerIcon preset={selectedPreset} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align={align} sideOffset={6}>
        <div className="grid grid-cols-3 gap-1.5">
          {MARKER_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => handleSelect(preset.value)}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-md border border-transparent bg-white text-slate-700 transition hover:border-slate-200 hover:bg-slate-50',
                preset.value === selectedPreset && 'border-sky-400 bg-sky-50'
              )}
            >
              <CityMarkerIcon preset={preset.value} size="md" />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
