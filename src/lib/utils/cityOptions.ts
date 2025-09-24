import type { CitySynonymOptionRecord } from '@/types'

export type CityOption = {
  cityId: string
  cityName: string
  markerPreset: string | null
  hasCoordinates: boolean
  synonyms: string[]
  isFavorite: boolean
}

export type CityOptionsResult = {
  cityOptions: CityOption[]
  cityLookupBySynonym: Map<string, CityOption>
  cityLookupById: Map<string, CityOption>
}

export function buildCityOptions(records: CitySynonymOptionRecord[]): CityOptionsResult {
  const byId = new Map<string, CityOption>()
  const bySynonym = new Map<string, CityOption>()
  const synonymsRegistry = new Map<string, Set<string>>()

  records.forEach((record) => {
    const normalizedSynonym = record.synonym.trim().toLowerCase()
    const normalizedCityName = record.cityName.trim().toLowerCase()

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
      synonymsSet.add(normalizedCityName)
    }

    if (record.markerPreset && !baseOption.markerPreset) {
      baseOption.markerPreset = record.markerPreset
    }

    if (record.hasCoordinates && !baseOption.hasCoordinates) {
      baseOption.hasCoordinates = true
    }

    if (record.isFavorite && !baseOption.isFavorite) {
      baseOption.isFavorite = true
    }

    if (!synonymsSet.has(normalizedSynonym)) {
      baseOption.synonyms.push(record.synonym)
      synonymsSet.add(normalizedSynonym)
    }

    bySynonym.set(normalizedSynonym, baseOption)
    bySynonym.set(normalizedCityName, baseOption)
  })

  const cityOptions = Array.from(byId.values()).sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) {
      return a.isFavorite ? -1 : 1
    }

    return a.cityName.localeCompare(b.cityName, 'ru')
  })

  return {
    cityOptions,
    cityLookupBySynonym: bySynonym,
    cityLookupById: new Map(cityOptions.map((option) => [option.cityId, option] as const))
  }
}
