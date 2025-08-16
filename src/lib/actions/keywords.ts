'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { keywordSchema, updateKeywordSchema, assignKeywordToCategorySchema } from '@/lib/validations/keywords'
import { extractKeywords } from '@/lib/utils/keywords'
import type { CreateKeywordData, UpdateKeywordData, AssignKeywordData, CategoryKeyword, UnrecognizedKeyword, CategorizationResult, KeywordMatch } from '@/types'

// Создание нового ключевого слова для категории
export async function createKeyword(data: CreateKeywordData) {
  const supabase = await createServerClient()

  try {
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    // Проверяем данные
    const validatedData = keywordSchema.parse(data)

    // Проверяем, что категория принадлежит пользователю
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', validatedData.category_id)
      .eq('user_id', user.id)
      .single()

    if (categoryError || !category) {
      return { error: 'Категория не найдена' }
    }

    // Создаем ключевое слово
    const { data: keyword, error } = await supabase
      .from('category_keywords')
      .insert({
        user_id: user.id,
        keyword: validatedData.keyword,
        category_id: validatedData.category_id
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // unique constraint violation
        return { error: 'Это ключевое слово уже существует' }
      }
      console.error('Ошибка создания ключевого слова:', error)
      return { error: 'Не удалось создать ключевое слово' }
    }

    // Удаляем из неопознанных ключевых слов, если оно там есть
    await supabase
      .from('unrecognized_keywords')
      .delete()
      .eq('keyword', validatedData.keyword)
      .eq('user_id', user.id)

    revalidatePath('/categories')
    return { success: true, data: keyword }
  } catch (err) {
    console.error('Ошибка валидации ключевого слова:', err)
    return { error: 'Неверные данные ключевого слова' }
  }
}

// Обновление ключевого слова
export async function updateKeyword(id: string, data: UpdateKeywordData) {
  const supabase = await createServerClient()

  try {
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    // Проверяем данные
    const validatedData = updateKeywordSchema.parse(data)

    // Если обновляется категория, проверяем что она принадлежит пользователю
    if (validatedData.category_id) {
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('id', validatedData.category_id)
        .eq('user_id', user.id)
        .single()

      if (categoryError || !category) {
        return { error: 'Категория не найдена' }
      }
    }

    // Обновляем ключевое слово
    const { data: keyword, error } = await supabase
      .from('category_keywords')
      .update(validatedData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // unique constraint violation
        return { error: 'Это ключевое слово уже существует' }
      }
      console.error('Ошибка обновления ключевого слова:', error)
      return { error: 'Не удалось обновить ключевое слово' }
    }

    revalidatePath('/categories')
    return { success: true, data: keyword }
  } catch (err) {
    console.error('Ошибка валидации ключевого слова:', err)
    return { error: 'Неверные данные ключевого слова' }
  }
}

// Удаление ключевого слова
export async function deleteKeyword(id: string) {
  const supabase = await createServerClient()

  try {
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    // Удаляем ключевое слово
    const { error } = await supabase
      .from('category_keywords')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Ошибка удаления ключевого слова:', error)
      return { error: 'Не удалось удалить ключевое слово' }
    }

    revalidatePath('/categories')
    return { success: true }
  } catch (err) {
    console.error('Ошибка удаления ключевого слова:', err)
    return { error: 'Произошла ошибка при удалении' }
  }
}

// Получение всех ключевых слов пользователя
export async function getKeywords() {
  const supabase = await createServerClient()

  try {
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    // Получаем ключевые слова с информацией о категориях
    const { data: keywords, error } = await supabase
      .from('category_keywords')
      .select(`
        *,
        categories (
          id,
          name,
          color,
          icon
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Ошибка получения ключевых слов:', error)
      return { error: 'Не удалось загрузить ключевые слова' }
    }

    return { success: true, data: keywords || [] }
  } catch (err) {
    console.error('Ошибка получения ключевых слов:', err)
    return { error: 'Произошла ошибка при загрузке' }
  }
}

// Получение ключевых слов для конкретной категории
export async function getKeywordsByCategory(categoryId: string) {
  const supabase = await createServerClient()

  try {
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    // Получаем ключевые слова для категории
    const { data: keywords, error } = await supabase
      .from('category_keywords')
      .select('*')
      .eq('category_id', categoryId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Ошибка получения ключевых слов категории:', error)
      return { error: 'Не удалось загрузить ключевые слова' }
    }

    return { success: true, data: keywords || [] }
  } catch (err) {
    console.error('Ошибка получения ключевых слов категории:', err)
    return { error: 'Произошла ошибка при загрузке' }
  }
}

// Назначение категории ключевому слову (из неопознанных)
export async function assignCategoryToKeyword(data: AssignKeywordData) {
  const supabase = await createServerClient()

  try {
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    // Проверяем данные
    const validatedData = assignKeywordToCategorySchema.parse(data)

    // Проверяем, что категория принадлежит пользователю
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', validatedData.category_id)
      .eq('user_id', user.id)
      .single()

    if (categoryError || !category) {
      return { error: 'Категория не найдена' }
    }

    // Добавляем ключевое слово к категории
    const { data: keyword, error: keywordError } = await supabase
      .from('category_keywords')
      .insert({
        user_id: user.id,
        keyword: validatedData.keyword,
        category_id: validatedData.category_id,

      })
      .select()
      .single()

    if (keywordError) {
      if (keywordError.code === '23505') { // unique constraint violation
        return { error: 'Это ключевое слово уже назначено категории' }
      }
      console.error('Ошибка назначения ключевого слова:', keywordError)
      return { error: 'Не удалось назначить ключевое слово' }
    }

    // Удаляем из неопознанных ключевых слов
    await supabase
      .from('unrecognized_keywords')
      .delete()
      .eq('keyword', validatedData.keyword)
      .eq('user_id', user.id)

    // Перекатегоризируем все неопознанные траты с этим ключевым словом
    await recategorizeExpensesByKeyword(validatedData.keyword, validatedData.category_id)

    revalidatePath('/categories')
    revalidatePath('/expenses')
    
    return { success: true, data: keyword }
  } catch (err) {
    console.error('Ошибка валидации назначения ключевого слова:', err)
    return { error: 'Неверные данные' }
  }
}



// Автоматическая категоризация расхода по описанию
export async function categorizeExpense(description: string): Promise<CategorizationResult> {
  const supabase = await createServerClient()

  try {
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        category_id: null,
        matched_keywords: [],
        auto_categorized: false
      }
    }

    // Получаем все ключевые слова пользователя
    const { data: keywords, error } = await supabase
      .from('category_keywords')
      .select('keyword, category_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error || !keywords) {
      return {
        category_id: null,
        matched_keywords: [],
        auto_categorized: false
      }
    }

    const descriptionLower = description.toLowerCase()
    const matches: KeywordMatch[] = []

    // Ищем совпадения ключевых слов
    for (const keyword of keywords) {
      if (descriptionLower.includes(keyword.keyword.toLowerCase())) {
        matches.push({
          keyword: keyword.keyword,
          category_id: keyword.category_id!
        })
      }
    }

    if (matches.length === 0) {
      // Сохраняем неопознанные ключевые слова
      await saveUnrecognizedKeywords(description)
      return {
        category_id: null,
        matched_keywords: [],
        auto_categorized: false
      }
    }

    // Берем первое найденное совпадение
    const bestMatch = matches[0]

    return {
      category_id: bestMatch.category_id,
      matched_keywords: matches.map(m => m.keyword),
      auto_categorized: true
    }
  } catch (error) {
    console.error('Ошибка категоризации:', error)
    return {
      category_id: null,
      matched_keywords: [],
      auto_categorized: false
    }
  }
}

// Сохранение неопознанных ключевых слов
export async function saveUnrecognizedKeywords(description: string) {
  const supabase = await createServerClient()

  try {
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    // Извлекаем ключевые слова из описания
    const words = extractKeywords(description)

    if (words.length === 0) {
      return { success: true, message: 'Нет ключевых слов для сохранения' }
    }

    // Получаем уже существующие ключевые слова пользователя
    const { data: existingKeywords } = await supabase
      .from('category_keywords')
      .select('keyword')
      .eq('user_id', user.id)

    const existingKeywordSet = new Set(existingKeywords?.map(k => k.keyword) || [])

    // Фильтруем только новые ключевые слова
    const newWords = words.filter(word => !existingKeywordSet.has(word))

    if (newWords.length === 0) {
      return { success: true, message: 'Все ключевые слова уже известны' }
    }

    // Сохраняем или обновляем неопознанные ключевые слова
    for (const word of newWords) {
      // Сначала проверяем, существует ли уже такое ключевое слово
      const { data: existing } = await supabase
        .from('unrecognized_keywords')
        .select('id, frequency')
        .eq('user_id', user.id)
        .eq('keyword', word)
        .single()

      if (existing) {
        // Обновляем существующее
        await supabase
          .from('unrecognized_keywords')
          .update({
            frequency: (existing.frequency || 0) + 1,
            last_seen: new Date().toISOString()
          })
          .eq('id', existing.id)
      } else {
        // Создаем новое
        await supabase
          .from('unrecognized_keywords')
          .insert({
            user_id: user.id,
            keyword: word,
            frequency: 1,
            first_seen: new Date().toISOString(),
            last_seen: new Date().toISOString()
          })
      }
    }

    return { success: true, data: newWords }
  } catch (error) {
    console.error('Ошибка сохранения неопознанных ключевых слов:', error)
    return { error: 'Не удалось сохранить ключевые слова' }
  }
}

// Получение неопознанных ключевых слов
export async function getUnrecognizedKeywords() {
  const supabase = await createServerClient()

  try {
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    // Получаем неопознанные ключевые слова, отсортированные по частоте
    const { data: keywords, error } = await supabase
      .from('unrecognized_keywords')
      .select('*')
      .eq('user_id', user.id)
      .order('frequency', { ascending: false })

    if (error) {
      console.error('Ошибка получения неопознанных ключевых слов:', error)
      return { error: 'Не удалось загрузить неопознанные ключевые слова' }
    }

    return { success: true, data: keywords || [] }
  } catch (err) {
    console.error('Ошибка получения неопознанных ключевых слов:', err)
    return { error: 'Произошла ошибка при загрузке' }
  }
}

// Перекатегоризация трат по новому ключевому слову
async function recategorizeExpensesByKeyword(keyword: string, categoryId: string) {
  const supabase = await createServerClient()

  try {
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    // Находим все неопознанные траты, содержащие это ключевое слово
    const { data: expenses } = await supabase
      .from('expenses')
      .select('id, description')
      .eq('user_id', user.id)
      .eq('status', 'uncategorized')
      .ilike('description', `%${keyword}%`)

    if (expenses && expenses.length > 0) {
      const expenseIds = expenses.map(e => e.id)

      // Обновляем статус и категорию
      await supabase
        .from('expenses')
        .update({
          category_id: categoryId,
          status: 'categorized',
          auto_categorized: true,
          matched_keywords: [keyword],
          updated_at: new Date().toISOString()
        })
        .in('id', expenseIds)
    }

    return { success: true, recategorized: expenses?.length || 0 }
  } catch (error) {
    console.error('Ошибка перекатегоризации:', error)
    return { error: 'Не удалось перекатегоризировать траты' }
  }
}

// Удаление неопознанного ключевого слова
export async function deleteUnrecognizedKeyword(id: string) {
  const supabase = await createServerClient()

  try {
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    // Удаляем неопознанное ключевое слово
    const { error } = await supabase
      .from('unrecognized_keywords')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Ошибка удаления неопознанного ключевого слова:', error)
      return { error: 'Не удалось удалить ключевое слово' }
    }

    return { success: true }
  } catch (err) {
    console.error('Ошибка удаления неопознанного ключевого слова:', err)
    return { error: 'Произошла ошибка при удалении' }
  }
}