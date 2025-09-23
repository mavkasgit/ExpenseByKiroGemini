'use server'

import { z } from 'zod'

import { createServerClient } from '@/lib/supabase/server'
import { parseCityCoordinates, normaliseMarkerPreset, type CityCoordinates } from '@/lib/utils/cityCoordinates'

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u, 'Некорректный формат даты')

const expenseRangeSchema = z.object({
  from: dateSchema.nullable().optional(),
  to: dateSchema.nullable().optional()
})

export interface CityExpenseSummary {
  cityId: string
  cityName: string
  totalAmount: number
  expenseCount: number
  coordinates: CityCoordinates | null
}

export async function getCityExpensesSummary(params: { from?: string | null; to?: string | null } = {}) {
  const supabase = await createServerClient()

  try {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    const validated = expenseRangeSchema.parse({
      from: params.from ?? null,
      to: params.to ?? null
    })

    let query = supabase
      .from('expenses')
      .select('city_id, amount, city:cities(id, name, coordinates)')
      .eq('user_id', user.id)
      .not('city_id', 'is', null)

    if (validated.from) {
      query = query.gte('expense_date', validated.from)
    }

    if (validated.to) {
      query = query.lte('expense_date', validated.to)
    }

    const { data, error } = await query

    if (error) {
      console.error('Ошибка загрузки расходов по городам:', error)
      return { error: 'Не удалось загрузить расходы по городам' }
    }

    const totals = new Map<string, CityExpenseSummary>()

    for (const entry of data ?? []) {
      if (!entry) {
        continue
      }

      const cityId = entry.city_id ?? entry.city?.id
      if (!cityId) {
        continue
      }

      const cityName = entry.city?.name ?? 'Без названия'
      const amount = typeof entry.amount === 'number' ? entry.amount : Number(entry.amount)
      if (!Number.isFinite(amount)) {
        continue
      }

      const existing = totals.get(cityId)
      if (existing) {
        existing.totalAmount += amount
        existing.expenseCount += 1
        continue
      }

      const parsedCoordinates = parseCityCoordinates(entry.city?.coordinates ?? null)
      const coordinates = parsedCoordinates
        ? { ...parsedCoordinates, markerPreset: normaliseMarkerPreset(parsedCoordinates.markerPreset) }
        : null

      totals.set(cityId, {
        cityId,
        cityName,
        totalAmount: amount,
        expenseCount: 1,
        coordinates
      })
    }

    const result = Array.from(totals.values()).sort((a, b) => b.totalAmount - a.totalAmount)

    return { success: true, data: result }
  } catch (error) {
    console.error('Не удалось получить статистику расходов по городам:', error)
    return { error: 'Произошла ошибка при загрузке расходов по городам' }
  }
}
