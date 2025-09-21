'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, Button, Input } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { getCitySynonyms, createCitySynonym, deleteCitySynonym } from '@/lib/actions/synonyms'
import { syncCitySynonyms } from '@/lib/utils/cityParser'
import type { CitySynonym } from '@/types'

interface SynonymFormState {
  city: string
  synonym: string
}

export function CitySynonymManager() {
  const [synonyms, setSynonyms] = useState<CitySynonym[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [formState, setFormState] = useState<SynonymFormState>({ city: '', synonym: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingMap, setDeletingMap] = useState<Record<string, boolean>>({})
  const { showToast } = useToast()

  const loadSynonyms = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getCitySynonyms()
      if (result.error) {
        showToast(result.error, 'error')
      } else if (result.success && result.data) {
        setSynonyms(result.data)
        syncCitySynonyms(result.data.map(record => ({ city: record.city, synonym: record.synonym })))
      }
    } catch (error) {
      console.error('Failed to load city synonyms', error)
      showToast('Не удалось загрузить синонимы городов', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadSynonyms()
  }, [loadSynonyms])

  const groupedSynonyms = useMemo(() => {
    const map = new Map<string, CitySynonym[]>()
    synonyms.forEach(record => {
      const cityKey = record.city.trim() || 'Без города'
      if (!map.has(cityKey)) {
        map.set(cityKey, [])
      }
      map.get(cityKey)!.push(record)
    })
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], 'ru'))
  }, [synonyms])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!formState.city.trim() || !formState.synonym.trim()) {
      showToast('Заполните оба поля', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createCitySynonym({ city: formState.city.trim(), synonym: formState.synonym.trim() })
      if (result.error) {
        showToast(result.error, 'error')
      } else if (result.success && result.data) {
        setSynonyms(prev => {
          const updated = [...prev, result.data]
          syncCitySynonyms(updated.map(record => ({ city: record.city, synonym: record.synonym })))
          return updated
        })
        showToast('Синоним города добавлен', 'success')
        setFormState({ city: '', synonym: '' })
      }
    } catch (error) {
      console.error('Failed to create city synonym', error)
      showToast('Не удалось добавить синоним города', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (synonym: CitySynonym) => {
    setDeletingMap(prev => ({ ...prev, [synonym.id]: true }))
    try {
      const result = await deleteCitySynonym({ id: synonym.id })
      if (result.error) {
        showToast(result.error, 'error')
      } else {
        setSynonyms(prev => {
          const updated = prev.filter(item => item.id !== synonym.id)
          syncCitySynonyms(updated.map(record => ({ city: record.city, synonym: record.synonym })))
          return updated
        })
        showToast('Синоним удален', 'success')
      }
    } catch (error) {
      console.error('Failed to delete city synonym', error)
      showToast('Не удалось удалить синоним', 'error')
    } finally {
      setDeletingMap(prev => ({ ...prev, [synonym.id]: false }))
    }
  }

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h5 className="text-base font-semibold text-gray-900">Синонимы городов</h5>
        <p className="text-sm text-gray-500 mt-1">
          Добавьте альтернативные написания городов, чтобы объединять их в аналитике и заметках. При совпадении будет отображаться
          основной город и использованный синоним.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-3">
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="synonym-city">Главный город</label>
          <Input
            id="synonym-city"
            placeholder="Например: Минск"
            value={formState.city}
            onChange={(event) => setFormState(prev => ({ ...prev, city: event.target.value }))}
            disabled={isSubmitting}
          />
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="synonym-alias">Синоним</label>
          <Input
            id="synonym-alias"
            placeholder="Например: Minsk"
            value={formState.synonym}
            onChange={(event) => setFormState(prev => ({ ...prev, synonym: event.target.value }))}
            disabled={isSubmitting}
          />
        </div>
        <div className="md:col-span-1 flex items-end">
          <Button type="submit" isLoading={isSubmitting} className="w-full md:w-auto">
            Добавить синоним
          </Button>
        </div>
      </form>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-sm text-gray-500">Загрузка синонимов...</div>
        ) : groupedSynonyms.length === 0 ? (
          <div className="text-sm text-gray-500">Пока нет ни одного синонима города.</div>
        ) : (
          groupedSynonyms.map(([city, entries]) => (
            <div key={city} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="text-sm font-semibold text-gray-800">{city}</div>
              <div className="flex flex-wrap gap-2">
                {entries.map(entry => (
                  <span key={entry.id} className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-xs">
                    {entry.synonym}
                    <button
                      type="button"
                      onClick={() => handleDelete(entry)}
                      className="hover:text-red-600 focus:outline-none"
                      disabled={!!deletingMap[entry.id] || isSubmitting}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
