export type MarkerPresetConfig = {
  value: string
  label: string
  color: string
}

export const DEFAULT_MARKER_PRESET = 'islands#blueIcon'

export const MARKER_PRESETS: MarkerPresetConfig[] = [
  { value: 'islands#blueIcon', label: 'Сапфировый маркер', color: '#2563EB' },
  { value: 'islands#redIcon', label: 'Алый маркер', color: '#DC2626' },
  { value: 'islands#greenIcon', label: 'Изумрудный маркер', color: '#16A34A' },
  { value: 'islands#darkOrangeIcon', label: 'Медный маркер', color: '#EA580C' },
  { value: 'islands#violetIcon', label: 'Аметистовый маркер', color: '#7C3AED' },
  { value: 'islands#blackIcon', label: 'Графитовый маркер', color: '#1F2937' },
  { value: 'islands#yellowIcon', label: 'Янтарный маркер', color: '#EAB308' },
  { value: 'islands#lightBlueIcon', label: 'Бирюзовый маркер', color: '#0EA5E9' },
  { value: 'islands#grayIcon', label: 'Серебристый маркер', color: '#64748B' }
]

export const markerPresetLookup = new Map(MARKER_PRESETS.map((preset) => [preset.value, preset] as const))

export function getMarkerColor(preset?: string | null, fallback?: string) {
  const normalised = preset ?? DEFAULT_MARKER_PRESET
  return markerPresetLookup.get(normalised)?.color ?? fallback ?? '#94A3B8'
}
