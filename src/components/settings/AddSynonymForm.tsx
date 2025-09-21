'use client'

import { useState } from 'react'
import { Input, Button } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { createCitySynonym } from '@/lib/actions/synonyms'

interface AddSynonymFormProps {
  city: string
  onSynonymAdded: () => void
}

export function AddSynonymForm({ city, onSynonymAdded }: AddSynonymFormProps) {
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
      const result = await createCitySynonym({ city, synonym: synonym.trim() })
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
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
      <Input
        placeholder="Добавить синоним"
        value={synonym}
        onChange={(e) => setSynonym(e.target.value)}
        disabled={isSubmitting}
        className="h-8 text-xs"
      />
      <Button type="submit" isLoading={isSubmitting} size="sm" variant="outline">
        Добавить
      </Button>
    </form>
  )
}
