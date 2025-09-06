'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { categorySchema, updateCategorySchema } from '@/lib/validations/categories'
import type { CreateCategoryData } from '@/types'

export async function createCategory(data: CreateCategoryData) {
  const supabase = await createServerClient()

  try {
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    // Проверяем данные
    const validatedData = categorySchema.parse(data)

    // Создаем категорию
    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        user_id: user.id,
        name: validatedData.name,
        color: validatedData.color || '#6366f1',
        icon: validatedData.icon || 'shopping-bag',
        group_name: validatedData.group_name || 'Основные'
      })
      .select()
      .single()

    if (error) {
      console.error('Ошибка создания категории:', error)
      return { error: 'Не удалось создать категорию' }
    }

    revalidatePath('/categories')
    return { success: true, data: category }
  } catch (err) {
    console.error('Ошибка валидации категории:', err)
    return { error: 'Неверные данные категории' }
  }
}

export async function updateCategory(id: string, data: Partial<CreateCategoryData>) {
  const supabase = await createServerClient()

  try {
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    // Проверяем данные
    const validatedData = updateCategorySchema.parse(data)

    // Обновляем категорию
    const { data: category, error } = await supabase
      .from('categories')
      .update({
        name: validatedData.name,
        color: validatedData.color,
        icon: validatedData.icon,
        group_name: validatedData.group_name,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id) // Проверяем, что категория принадлежит пользователю
      .select()
      .single()

    if (error) {
      console.error('Ошибка обновления категории:', error)
      return { error: 'Не удалось обновить категорию' }
    }

    revalidatePath('/categories')
    return { success: true, data: category }
  } catch (err) {
    console.error('Ошибка валидации категории:', err)
    return { error: 'Неверные данные категории' }
  }
}

export async function deleteCategory(id: string) {
  const supabase = await createServerClient()

  try {
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    // Проверяем, есть ли расходы с этой категорией
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('id')
      .eq('category_id', id)
      .eq('user_id', user.id)
      .limit(1)

    if (expensesError) {
      console.error('Ошибка проверки расходов:', expensesError)
      return { error: 'Не удалось проверить связанные расходы' }
    }

    if (expenses && expenses.length > 0) {
      return { error: 'Нельзя удалить категорию, которая используется в расходах' }
    }

    // Удаляем категорию
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Проверяем, что категория принадлежит пользователю

    if (error) {
      console.error('Ошибка удаления категории:', error)
      return { error: 'Не удалось удалить категорию' }
    }

    revalidatePath('/categories')
    return { success: true }
  } catch (err) {
    console.error('Ошибка удаления категории:', err)
    return { error: 'Произошла ошибка при удалении' }
  }
}

export async function createDefaultCategories() {
  const supabase = await createServerClient()

  try {
    const startTime = performance.now()
    
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    // Стандартные группы
    const standardGroups = [
      { name: 'Основные', icon: 'shopping-bag', color: '#6366f1', sort_order: 1 },
      { name: 'Транспорт', icon: 'car', color: '#3b82f6', sort_order: 2 },
      { name: 'Еда и напитки', icon: 'food', color: '#f59e0b', sort_order: 3 },
      { name: 'Развлечения', icon: 'entertainment', color: '#ec4899', sort_order: 4 },
      { name: 'Здоровье', icon: 'health', color: '#ef4444', sort_order: 5 },
      { name: 'Дом и быт', icon: 'home', color: '#10b981', sort_order: 6 },
      { name: 'Образование', icon: 'education', color: '#8b5cf6', sort_order: 7 },
      { name: 'Путешествия', icon: 'travel', color: '#06b6d4', sort_order: 8 }
    ]

    // Подготавливаем данные для массовой вставки групп
    const groupsToInsert = standardGroups.map(group => ({
      user_id: user.id,
      name: group.name,
      icon: group.icon,
      color: group.color,
      sort_order: group.sort_order
    }))

    // Параллельно получаем существующие категории и создаем группы
    const [existingCategoriesResult, groupsResult] = await Promise.all([
      supabase
        .from('categories')
        .select('name')
        .eq('user_id', user.id),
      // Массовая вставка групп с правильной обработкой ошибок
      supabase
        .from('category_groups')
        .upsert(groupsToInsert, { 
          onConflict: 'user_id,name',
          ignoreDuplicates: false // Изменено на false для лучшего контроля
        })
        .select()
    ])

    // Проверяем результат создания групп
    if (groupsResult.error) {
      console.error('❌ Error creating groups:', groupsResult.error)
      // Не останавливаем выполнение, продолжаем создавать категории
    } else {
      console.log(`✅ Groups created/updated: ${groupsResult.data?.length || 0}`)
    }

    const existingNames = new Set(existingCategoriesResult.data?.map(cat => cat.name) || [])

    // Стандартные категории с иконками, цветами и группами
    const defaultCategories = [
      { name: 'Продукты', icon: 'shopping-bag', color: '#10b981', group_name: 'Еда и напитки' },
      { name: 'Транспорт', icon: 'car', color: '#3b82f6', group_name: 'Транспорт' },
      { name: 'Еда вне дома', icon: 'food', color: '#f59e0b', group_name: 'Еда и напитки' },
      { name: 'Бары и рестораны', icon: 'entertainment', color: '#8b5cf6', group_name: 'Развлечения' },
      { name: 'Развлечения', icon: 'entertainment', color: '#ec4899', group_name: 'Развлечения' },
      { name: 'Регулярные', icon: 'bills', color: '#6b7280', group_name: 'Основные' },
      { name: 'Здоровье', icon: 'health', color: '#ef4444', group_name: 'Здоровье' },
      { name: 'Одежда', icon: 'clothes', color: '#06b6d4', group_name: 'Основные' },
      { name: 'Алкоголь', icon: 'other', color: '#84cc16', group_name: 'Еда и напитки' },
      { name: 'Подарки', icon: 'other', color: '#f97316', group_name: 'Основные' },
      { name: 'Прочее', icon: 'other', color: '#6b7280', group_name: 'Основные' },
      { name: 'Путешествия', icon: 'travel', color: '#3b82f6', group_name: 'Путешествия' },
      { name: 'Гаджеты', icon: 'other', color: '#6366f1', group_name: 'Основные' },
      { name: 'Праздники', icon: 'entertainment', color: '#ec4899', group_name: 'Развлечения' },
      { name: 'Красота и здоровье', icon: 'health', color: '#ef4444', group_name: 'Здоровье' },
      { name: 'Образование', icon: 'education', color: '#10b981', group_name: 'Образование' },
      { name: 'WB', icon: 'shopping-bag', color: '#8b5cf6', group_name: 'Основные' },
      { name: 'Коммунальные платежи', icon: 'bills', color: '#f59e0b', group_name: 'Дом и быт' },
      { name: 'Электроэнергия', icon: 'home', color: '#f97316', group_name: 'Дом и быт' },
      { name: 'Ремонт', icon: 'home', color: '#6b7280', group_name: 'Дом и быт' },
      { name: 'Интернет', icon: 'bills', color: '#06b6d4', group_name: 'Дом и быт' },
      { name: 'Природный газ', icon: 'home', color: '#84cc16', group_name: 'Дом и быт' },
      { name: 'Все для дома', icon: 'home', color: '#10b981', group_name: 'Дом и быт' }
    ]

    // Фильтруем категории, которых еще нет у пользователя
    const newCategories = defaultCategories.filter(category => !existingNames.has(category.name))

    if (newCategories.length === 0) {
      return { success: true, message: 'Все стандартные категории уже существуют' }
    }

    // Создаем только новые категории
    const categoriesToInsert = newCategories.map(category => ({
      user_id: user.id,
      name: category.name,
      icon: category.icon,
      color: category.color,
      group_name: category.group_name
    }))

    // Используем upsert для быстрой вставки без проверки дубликатов
    const { data: createdCategories, error } = await supabase
      .from('categories')
      .upsert(categoriesToInsert, { 
        onConflict: 'user_id,name',
        ignoreDuplicates: true 
      })
      .select()

    if (error) {
      console.error('Ошибка создания стандартных категорий:', error)
      return { error: 'Не удалось создать стандартные категории' }
    }

    const endTime = performance.now()
    console.log(`🚀 Standard categories & groups created in ${(endTime - startTime).toFixed(2)}ms`)

    // Проверяем, что группы действительно созданы
    const { data: finalGroups } = await supabase
      .from('category_groups')
      .select('name')
      .eq('user_id', user.id)

    const groupsCount = finalGroups?.length || 0
    const categoriesCount = createdCategories?.length || 0

    return { 
      success: true, 
      data: createdCategories, 
      message: `Создано ${categoriesCount} категорий и ${groupsCount} групп` 
    }
  } catch (err) {
    console.error('Ошибка создания стандартных категорий:', err)
    return { error: 'Произошла ошибка при создании категорий' }
  }
}

export async function getCategories() {
  const supabase = await createServerClient()

  try {
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    // Получаем категории пользователя
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Ошибка получения категорий:', error)
      return { error: 'Не удалось загрузить категории' }
    }

    return { success: true, data: categories || [] }
  } catch (err) {
    console.error('Ошибка получения категорий:', err)
    return { error: 'Произошла ошибка при загрузке' }
  }
}

// Функция для принудительного создания стандартных групп
export async function ensureStandardGroups() {
  const supabase = await createServerClient()

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    const standardGroups = [
      { name: 'Основные', icon: 'shopping-bag', color: '#6366f1', sort_order: 1 },
      { name: 'Транспорт', icon: 'car', color: '#3b82f6', sort_order: 2 },
      { name: 'Еда и напитки', icon: 'food', color: '#f59e0b', sort_order: 3 },
      { name: 'Развлечения', icon: 'entertainment', color: '#ec4899', sort_order: 4 },
      { name: 'Здоровье', icon: 'health', color: '#ef4444', sort_order: 5 },
      { name: 'Дом и быт', icon: 'home', color: '#10b981', sort_order: 6 },
      { name: 'Образование', icon: 'education', color: '#8b5cf6', sort_order: 7 },
      { name: 'Путешествия', icon: 'travel', color: '#06b6d4', sort_order: 8 }
    ]

    const groupsToInsert = standardGroups.map(group => ({
      user_id: user.id,
      name: group.name,
      icon: group.icon,
      color: group.color,
      sort_order: group.sort_order
    }))

    const { data, error } = await supabase
      .from('category_groups')
      .upsert(groupsToInsert, { 
        onConflict: 'user_id,name',
        ignoreDuplicates: false
      })
      .select()

    if (error) {
      console.error('❌ Error ensuring groups:', error)
      return { error: 'Не удалось создать группы' }
    }

    return { success: true, data, message: `Обеспечено ${data.length} групп` }
  } catch (err) {
    console.error('❌ Error in ensureStandardGroups:', err)
    return { error: 'Произошла ошибка при создании групп' }
  }
}

// Оптимизированная функция для получения категорий и групп одним запросом
export async function getCategoriesWithGroups() {
  const supabase = await createServerClient()

  try {
    const startTime = performance.now()
    
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    // Параллельно получаем категории и группы для максимальной скорости
    const [categoriesResult, groupsResult] = await Promise.all([
      supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('category_groups')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })
    ])

    const endTime = performance.now()
    console.log(`⚡ Categories & Groups loaded in ${(endTime - startTime).toFixed(2)}ms`)

    if (categoriesResult.error) {
      console.error('Ошибка получения категорий:', categoriesResult.error)
      return { error: 'Не удалось загрузить категории' }
    }

    if (groupsResult.error) {
      console.error('Ошибка получения групп:', groupsResult.error)
      return { error: 'Не удалось загрузить группы' }
    }

    return { 
      success: true, 
      data: {
        categories: categoriesResult.data || [],
        groups: groupsResult.data || []
      }
    }
  } catch (err) {
    console.error('Ошибка получения данных:', err)
    return { error: 'Произошла ошибка при загрузке' }
  }
}

export async function deleteAllCategories() {
  const supabase = await createServerClient()

  try {
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    // Проверяем, есть ли расходы с категориями
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('id')
      .eq('user_id', user.id)
      .not('category_id', 'is', null)
      .limit(1)

    if (expensesError) {
      console.error('Ошибка проверки расходов:', expensesError)
      return { error: 'Не удалось проверить связанные расходы' }
    }

    if (expenses && expenses.length > 0) {
      return { error: 'Нельзя удалить категории, которые используются в расходах' }
    }

    // Удаляем все категории и группы пользователя параллельно
    const [categoriesResult, groupsResult] = await Promise.all([
      supabase
        .from('categories')
        .delete()
        .eq('user_id', user.id),
      supabase
        .from('category_groups')
        .delete()
        .eq('user_id', user.id)
    ])

    if (categoriesResult.error) {
      console.error('Ошибка удаления категорий:', categoriesResult.error)
      return { error: 'Не удалось удалить категории' }
    }

    if (groupsResult.error) {
      console.error('Ошибка удаления групп:', groupsResult.error)
      return { error: 'Не удалось удалить группы' }
    }

    revalidatePath('/categories')
    return { success: true, message: 'Все категории и группы удалены' }
  } catch (err) {
    console.error('Ошибка удаления всех данных:', err)
    return { error: 'Произошла ошибка при удалении' }
  }
}

export async function resetToDefaultCategories() {
  const supabase = await createServerClient()

  try {
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    // Проверяем, есть ли расходы с категориями
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('id')
      .eq('user_id', user.id)
      .not('category_id', 'is', null)
      .limit(1)

    if (expensesError) {
      console.error('Ошибка проверки расходов:', expensesError)
      return { error: 'Не удалось проверить связанные расходы' }
    }

    if (expenses && expenses.length > 0) {
      return { error: 'Нельзя сбросить категории, которые используются в расходах' }
    }

    // Удаляем все существующие категории и группы параллельно
    const [deleteCategoriesResult, deleteGroupsResult] = await Promise.all([
      supabase
        .from('categories')
        .delete()
        .eq('user_id', user.id),
      supabase
        .from('category_groups')
        .delete()
        .eq('user_id', user.id)
    ])

    if (deleteCategoriesResult.error) {
      console.error('Ошибка удаления категорий:', deleteCategoriesResult.error)
      return { error: 'Не удалось удалить существующие категории' }
    }

    if (deleteGroupsResult.error) {
      console.error('Ошибка удаления групп:', deleteGroupsResult.error)
      return { error: 'Не удалось удалить существующие группы' }
    }

    // Создаем стандартные категории
    const defaultResult = await createDefaultCategories()
    
    if (defaultResult.error) {
      return { error: defaultResult.error }
    }

    revalidatePath('/categories')
    return { success: true, message: 'Категории сброшены к стандартным' }
  } catch (err) {
    console.error('Ошибка сброса категорий:', err)
    return { error: 'Произошла ошибка при сбросе' }
  }
}

export async function moveCategoryToGroup(categoryId: string, newGroupName: string) {
  const supabase = await createServerClient()

  try {
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    // Обновляем группу категории
    const { data: category, error } = await supabase
      .from('categories')
      .update({
        group_name: newGroupName,
        updated_at: new Date().toISOString()
      })
      .eq('id', categoryId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Ошибка обновления группы категории:', error)
      return { error: 'Не удалось обновить группу категории' }
    }

    revalidatePath('/categories')
    return { success: true, data: category }
  } catch (err) {
    console.error('Ошибка обновления группы категории:', err)
    return { error: 'Произошла ошибка при обновлении группы' }
  }
}

// Функции для работы с группами категорий
export async function getCategoryGroups() {
  const supabase = await createServerClient()

  try {
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    // Получаем группы из новой таблицы category_groups
    const { data: groups, error } = await supabase
      .from('category_groups')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Ошибка получения групп:', error)
      return { error: 'Не удалось загрузить группы' }
    }

    return { success: true, data: groups || [] }
  } catch (err) {
    console.error('Ошибка получения групп:', err)
    return { error: 'Произошла ошибка при загрузке групп' }
  }
}

export async function createCategoryGroup(data: { name: string; icon?: string; color?: string; description?: string }) {
  const supabase = await createServerClient()

  try {
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    // Получаем максимальный sort_order для определения позиции новой группы
    const { data: maxOrderGroup } = await supabase
      .from('category_groups')
      .select('sort_order')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const nextSortOrder = (maxOrderGroup?.sort_order || 0) + 1

    // Создаем новую группу
    const { data: group, error } = await supabase
      .from('category_groups')
      .insert({
        user_id: user.id,
        name: data.name.trim(),
        icon: data.icon || 'other',
        color: data.color || '#6366f1',
        description: data.description || null,
        sort_order: nextSortOrder
      })
      .select()
      .single()

    if (error) {
      console.error('Ошибка создания группы:', error)
      if (error.code === '23505') { // Unique constraint violation
        return { error: 'Группа с таким названием уже существует' }
      }
      return { error: 'Не удалось создать группу' }
    }

    revalidatePath('/categories')
    return { success: true, data: group }
  } catch (err) {
    console.error('Ошибка создания группы:', err)
    return { error: 'Произошла ошибка при создании группы' }
  }
}

export async function updateCategoryGroup(groupId: string, data: { name: string; icon?: string; color?: string; description?: string }) {
  const supabase = await createServerClient()

  try {
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    // Получаем текущую группу для получения старого названия
    const { data: currentGroup, error: getCurrentError } = await supabase
      .from('category_groups')
      .select('name')
      .eq('id', groupId)
      .eq('user_id', user.id)
      .single()

    if (getCurrentError || !currentGroup) {
      return { error: 'Группа не найдена' }
    }

    // Обновляем группу
    const { data: updatedGroup, error: updateError } = await supabase
      .from('category_groups')
      .update({
        name: data.name.trim(),
        icon: data.icon,
        color: data.color,
        description: data.description,
        updated_at: new Date().toISOString()
      })
      .eq('id', groupId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Ошибка обновления группы:', updateError)
      if (updateError.code === '23505') { // Unique constraint violation
        return { error: 'Группа с таким названием уже существует' }
      }
      return { error: 'Не удалось обновить группу' }
    }

    // Если название изменилось, обновляем group_name во всех категориях
    if (currentGroup.name !== data.name.trim()) {
      await supabase
        .from('categories')
        .update({
          group_name: data.name.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('group_name', currentGroup.name)
        .eq('user_id', user.id)
    }

    revalidatePath('/categories')
    return { success: true, data: updatedGroup }
  } catch (err) {
    console.error('Ошибка обновления группы:', err)
    return { error: 'Произошла ошибка при обновлении группы' }
  }
}

export async function deleteCategoryGroup(groupId: string) {
  const supabase = await createServerClient()

  try {
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' }
    }

    // Получаем группу для получения её названия
    const { data: group, error: getGroupError } = await supabase
      .from('category_groups')
      .select('name')
      .eq('id', groupId)
      .eq('user_id', user.id)
      .single()

    if (getGroupError || !group) {
      return { error: 'Группа не найдена' }
    }

    // Проверяем, что это не группа "Основные" (её нельзя удалять)
    if (group.name === 'Основные') {
      return { error: 'Нельзя удалить группу "Основные"' }
    }

    // Перемещаем все категории из удаляемой группы в "Основные"
    await supabase
      .from('categories')
      .update({
        group_name: 'Основные',
        updated_at: new Date().toISOString()
      })
      .eq('group_name', group.name)
      .eq('user_id', user.id)

    // Удаляем группу
    const { error: deleteError } = await supabase
      .from('category_groups')
      .delete()
      .eq('id', groupId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Ошибка удаления группы:', deleteError)
      return { error: 'Не удалось удалить группу' }
    }

    revalidatePath('/categories')
    return { success: true, message: 'Группа удалена, категории перемещены в "Основные"' }
  } catch (err) {
    console.error('Ошибка удаления группы:', err)
    return { error: 'Произошла ошибка при удалении группы' }
  }
}

