'use client'

import { useState } from 'react'
import { Input, Button } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { createCitySynonym } from '@/lib/actions/synonyms'

interface AddSynonymFormProps {
  cityId: string
  cityName: string
  onSynonymAdded: () => void
}

export function AddSynonymForm({ cityId, cityName, onSynonymAdded }: AddSynonymFormProps) {
  const [synonym, setSynonym] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showToast } = useToast()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!synonym.trim()) {
      showToast('Введите синоним', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createCitySynonym({ cityId, synonym: synonym.trim() })
      if (result.error) {
        showToast(result.error, 'error')
      } else {
        showToast('Синоним добавлен', 'success')
        setSynonym('')
        onSynonymAdded()
      }
    } catch (error) {
      showToast('Не удалось добавить синоним', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Input
        placeholder={`Добавить альтернативное написание для «${cityName}»`}
        value={synonym}
        onChange={(event) => setSynonym(event.target.value)}
        disabled={isSubmitting}
        className="h-10 flex-1 text-sm"
      />
      <Button type="submit" isLoading={isSubmitting} size="sm" variant="outline" className="sm:w-auto">
        Добавить
      </Button>
    </form>
  )
}
