'use client'

import { useEffect, useState } from 'react'
import { getCitySynonyms } from '@/lib/actions/synonyms'
import { syncCitySynonyms } from '@/lib/utils/cityParser'
import type { CitySynonym } from '@/types'

export function useCitySynonyms() {
  const [synonyms, setSynonyms] = useState<CitySynonym[]>([])
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
          setSynonyms(result.data)
          syncCitySynonyms(result.data.map(record => ({ city: record.city, synonym: record.synonym })))
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
