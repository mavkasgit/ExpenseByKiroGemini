'use client'

import { useEffect, useState } from 'react'
import { getCitySynonyms } from '@/lib/actions/synonyms'
import { syncCitySynonyms } from '@/lib/utils/cityParser'
import type { CitySynonymWithCity } from '@/types'

interface CitySynonymRecord {
  id: number
  cityId: string
  cityName: string
  synonym: string
}

export function useCitySynonyms() {
  const [synonyms, setSynonyms] = useState<CitySynonymRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        const result = await getCitySynonyms()
        if (!isMounted) {
          return
        }

        if (result.success && result.data) {
          const records = (result.data as CitySynonymWithCity[])
            .map((record) => {
              const cityId = record.city?.id ?? record.city_id
              const cityName = record.city?.name ?? record.synonym
              if (!cityId) {
                return null
              }
              return {
                id: Number(record.id),
                cityId,
                cityName,
                synonym: record.synonym
              } satisfies CitySynonymRecord
            })
            .filter((record): record is CitySynonymRecord => record !== null)

          setSynonyms(records)
          syncCitySynonyms(records.map(record => ({ city: record.cityName, synonym: record.synonym })))
        }
      } catch (error) {
        console.error('Failed to preload city synonyms', error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [])

  return { synonyms, isLoading }
}
