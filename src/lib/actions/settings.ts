'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// --- User Settings ---

export interface UserSettings {
  enable_bilingual_keywords?: boolean
  enable_bilingual_cities?: boolean
}

export async function getUserSettings(): Promise<{ settings?: UserSettings; error?: string }> {
  const supabase = await createServerClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Пользователь не авторизован' }
  }

  return { settings: user.user_metadata as UserSettings }
}

export async function updateUserSettings(newSettings: Partial<UserSettings>): Promise<{ settings?: UserSettings; error?: string }> {
  const supabase = await createServerClient()
  const { data, error } = await supabase.auth.updateUser({
    data: newSettings,
  })

  if (error) {
    return { error: 'Ошибка при обновлении настроек: ' + error.message }
  }

  revalidatePath('/', 'layout')

  return { settings: data.user?.user_metadata as UserSettings }
}


// --- Data Deletion ---

interface SelectiveDeleteOptions {
  deleteGroups?: boolean
  deleteCategories?: boolean
  deleteKeywords?: boolean
  deleteExpenses?: boolean
}

// Абсолютно новое действие для выборочного удаления
export async function selectiveDelete(options: SelectiveDeleteOptions) {
  const supabase = await createServerClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Пользователь не авторизован' }
  }

  try {
    const deletedItems: string[] = []

    // Обратите внимание: порядок важен из-за внешних ключей.
    // Сначала удаляем расходы, потом ключевые слова, потом категории, потом группы.

    if (options.deleteExpenses) {
      const { error } = await supabase.from('expenses').delete().eq('user_id', user.id)
      if (error) throw new Error('Ошибка при удалении расходов: ' + error.message)
      deletedItems.push('расходы')
    }

    if (options.deleteKeywords) {
      await supabase.from('keyword_synonyms').delete().eq('user_id', user.id)
      await supabase.from('unrecognized_keywords').delete().eq('user_id', user.id)
      const { error } = await supabase.from('category_keywords').delete().eq('user_id', user.id)
      if (error) throw new Error('Ошибка при удалении ключевых слов: ' + error.message)
      deletedItems.push('ключевые слова и синонимы')
    }

    if (options.deleteCategories) {
      // Сначала нужно отвязать категории от расходов, если они не удаляются
      if (!options.deleteExpenses) {
        const { error: updateError } = await supabase
          .from('expenses')
          .update({ category_id: null })
          .eq('user_id', user.id)
        if (updateError) throw new Error('Ошибка при отвязке категорий от расходов: ' + updateError.message)
      }
      const { error } = await supabase.from('categories').delete().eq('user_id', user.id)
      if (error) throw new Error('Ошибка при удалении категорий: ' + error.message)
      deletedItems.push('категории')
    }

    if (options.deleteGroups) {
       // Сначала нужно отвязать группы от категорий, если они не удаляются
      if (!options.deleteCategories) {
        const { error: updateError } = await supabase
          .from('categories')
          .update({ category_group_id: null })
          .eq('user_id', user.id)
        if (updateError) throw new Error('Ошибка при отвязке групп от категорий: ' + updateError.message)
      }
      const { error } = await supabase.from('category_groups').delete().eq('user_id', user.id)
      if (error) throw new Error('Ошибка при удалении групп: ' + error.message)
      deletedItems.push('группы')
    }

    revalidatePath('/', 'layout')
    return { success: true, message: `Успешно удалены: ${deletedItems.join(', ') || 'ничего'}.` }

  } catch (error: any) {
    return { error: error.message }
  }
}

// Абсолютно новое действие для ПОЛНОГО удаления всех данных
export async function deleteAllUserData() {
  const supabase = await createServerClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Пользователь не авторизован' }
  }

  try {
    // Порядок важен!
    await supabase.from('expenses').delete().eq('user_id', user.id)
    await supabase.from('keywords').delete().eq('user_id', user.id)
    await supabase.from('categories').delete().eq('user_id', user.id)
    await supabase.from('category_groups').delete().eq('user_id', user.id)

    revalidatePath('/', 'layout')
    return { success: true, message: 'Все ваши данные были успешно удалены.' }

  } catch (error: any) {
    return { error: 'Произошла ошибка при полном удалении данных: ' + error.message }
  }
}
