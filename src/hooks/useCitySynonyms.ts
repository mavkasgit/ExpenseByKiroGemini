'use client'

import { useCallback, useEffect, useState } from 'react'
import { getCitySynonyms } from '@/lib/actions/synonyms'
import { syncCitySynonyms } from '@/lib/utils/cityParser'
import { parseCityCoordinates, normaliseMarkerPreset } from '@/lib/utils/cityCoordinates'
import type { CitySynonymWithCity } from '@/types'

export interface CitySynonymRecord {
  id: number
  cityId: string
  cityName: string
  synonym: string
  markerPreset: string | null
  hasCoordinates: boolean
  isFavorite: boolean
}

export function useCitySynonyms() {
  const [synonyms, setSynonyms] = useState<CitySynonymRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const buildRecords = useCallback((data: CitySynonymWithCity[]): CitySynonymRecord[] => {
    return data
      .map((record) => {
        const cityId = record.city?.id ?? record.city_id
        const cityName = record.city?.name ?? record.synonym
        if (!cityId) {
          return null
        }

        const parsedCoordinates = parseCityCoordinates(record.city?.coordinates ?? null)

        return {
          id: Number(record.id),
          cityId,
          cityName,
          synonym: record.synonym,
          markerPreset: parsedCoordinates ? normaliseMarkerPreset(parsedCoordinates.markerPreset) : null,
          hasCoordinates: Boolean(parsedCoordinates),
          isFavorite: Boolean(record.city?.is_favorite)
        } satisfies CitySynonymRecord
      })
      .filter((record): record is CitySynonymRecord => record !== null)
  }, [])

  const loadSynonyms = useCallback(async () => {
    try {
      const result = await getCitySynonyms()
      if (result.success && result.data) {
        return buildRecords(result.data as CitySynonymWithCity[])
      }
    } catch (error) {
      console.error('Failed to preload city synonyms', error)
    }
    return null
  }, [buildRecords])

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setIsLoading(true)
      const records = await loadSynonyms()
      if (!isMounted) {
        return
      }
      if (records) {
        setSynonyms(records)
        syncCitySynonyms(records.map(record => ({ city: record.cityName, synonym: record.synonym })))
      }
      setIsLoading(false)
    }

    void load()

    return () => {
      isMounted = false
    }
  }, [loadSynonyms])

  const updateCityFavorite = useCallback((cityId: string, isFavorite: boolean) => {
    setSynonyms(prev => prev.map(record => (
      record.cityId === cityId
        ? { ...record, isFavorite }
        : record
    )))
  }, [])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    const records = await loadSynonyms()
    if (records) {
      setSynonyms(records)
      syncCitySynonyms(records.map(record => ({ city: record.cityName, synonym: record.synonym })))
    }
    setIsLoading(false)
  }, [loadSynonyms])

  return { synonyms, isLoading, refresh, updateCityFavorite }
}
