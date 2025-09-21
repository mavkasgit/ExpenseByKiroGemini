'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import {
  keywordSynonymSchema,
  deleteKeywordSynonymSchema,
  citySynonymSchema,
  deleteCitySynonymSchema,
  type CreateKeywordSynonymData,
  type DeleteKeywordSynonymData,
  type CreateCitySynonymData,
  type DeleteCitySynonymData
} from '@/lib/validations/synonyms'
import type { KeywordSynonym, CitySynonym } from '@/types'

export async function getKeywordSynonyms(keywordId: string) {
  const supabase = await createServerClient()

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    const { data, error } = await supabase
      .from('keyword_synonyms')
      .select('*')
      .eq('user_id', user.id)
      .eq('keyword_id', keywordId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Ошибка загрузки синонимов ключевого слова:', error)
      return { error: 'Не удалось загрузить синонимы' }
    }

    return { success: true, data: (data || []) as KeywordSynonym[] }
  } catch (err) {
    console.error('Ошибка получения синонимов ключевого слова:', err)
    return { error: 'Произошла ошибка при загрузке синонимов' }
  }
}

export async function createKeywordSynonym(data: CreateKeywordSynonymData) {
  const supabase = await createServerClient()

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    const validated = keywordSynonymSchema.parse(data)

    const { data: keyword, error: keywordError } = await supabase
      .from('category_keywords')
      .select('id, user_id')
      .eq('id', validated.keyword_id)
      .eq('user_id', user.id)
      .single()

    if (keywordError || !keyword) {
      return { error: 'Ключевое слово не найдено' }
    }

    const { data: synonym, error } = await supabase
      .from('keyword_synonyms')
      .insert({
        keyword_id: validated.keyword_id,
        synonym: validated.synonym.trim(),
        user_id: user.id
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return { error: 'Такой синоним уже существует' }
      }
      console.error('Ошибка создания синонима ключевого слова:', error)
      return { error: 'Не удалось создать синоним' }
    }

    revalidatePath('/categories')
    return { success: true, data: synonym as KeywordSynonym }
  } catch (err) {
    console.error('Ошибка добавления синонима ключевого слова:', err)
    return { error: 'Произошла ошибка при создании синонима' }
  }
}

export async function deleteKeywordSynonym(data: DeleteKeywordSynonymData) {
  const supabase = await createServerClient()

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    const validated = deleteKeywordSynonymSchema.parse(data)

    const { error } = await supabase
      .from('keyword_synonyms')
      .delete()
      .eq('id', validated.id)
      .eq('keyword_id', validated.keyword_id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Ошибка удаления синонима ключевого слова:', error)
      return { error: 'Не удалось удалить синоним' }
    }

    revalidatePath('/categories')
    return { success: true }
  } catch (err) {
    console.error('Ошибка удаления синонима ключевого слова:', err)
    return { error: 'Произошла ошибка при удалении синонима' }
  }
}

export async function getCitySynonyms() {
  const supabase = await createServerClient()

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    const { data, error } = await supabase
      .from('city_synonyms')
      .select('*')
      .eq('user_id', user.id)
      .order('city', { ascending: true })
      .order('synonym', { ascending: true })

    if (error) {
      console.error('Ошибка загрузки синонимов городов:', error)
      return { error: 'Не удалось загрузить синонимы городов' }
    }

    return { success: true, data: (data || []) as CitySynonym[] }
  } catch (err) {
    console.error('Ошибка получения синонимов городов:', err)
    return { error: 'Произошла ошибка при загрузке синонимов городов' }
  }
}

export async function createCitySynonym(data: CreateCitySynonymData) {
  const supabase = await createServerClient()

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    const validated = citySynonymSchema.parse(data)

    const { data: synonym, error } = await supabase
      .from('city_synonyms')
      .insert({
        city: validated.city.trim(),
        synonym: validated.synonym.trim(),
        user_id: user.id
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return { error: 'Такой синоним города уже существует' }
      }
      console.error('Ошибка создания синонима города:', error)
      return { error: 'Не удалось создать синоним города' }
    }

    revalidatePath('/settings')
    return { success: true, data: synonym as CitySynonym }
  } catch (err) {
    console.error('Ошибка добавления синонима города:', err)
    return { error: 'Произошла ошибка при создании синонима города' }
  }
}

export async function deleteCitySynonym(data: DeleteCitySynonymData) {
  const supabase = await createServerClient()

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    const validated = deleteCitySynonymSchema.parse(data)

    const { error } = await supabase
      .from('city_synonyms')
      .delete()
      .eq('id', validated.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Ошибка удаления синонима города:', error)
      return { error: 'Не удалось удалить синоним города' }
    }

    revalidatePath('/settings')
    return { success: true }
  } catch (err) {
    console.error('Ошибка удаления синонима города:', err)
    return { error: 'Произошла ошибка при удалении синонима города' }
  }
}
