import { categorizeExpense, saveUnrecognizedKeywords } from '@/lib/actions/keywords'
import type { CategorizationResult } from '@/types'

/**
 * Автоматически категоризирует расход по описанию
 * @param description - описание расхода
 * @returns результат категоризации
 */
export async function autoCategorizе(description: string): Promise<CategorizationResult> {
  if (!description || description.trim().length === 0) {
    return {
      category_id: null,
      matched_keywords: [],
      auto_categorized: false
    }
  }

  try {
    const result = await categorizeExpense(description.trim())
    return result
  } catch (error) {
    console.error('Ошибка автокатегоризации:', error)
    
    // В случае ошибки сохраняем неопознанные ключевые слова
    await saveUnrecognizedKeywords(description)
    
    return {
      category_id: null,
      matched_keywords: [],
      auto_categorized: false
    }
  }
}

/**
 * Пакетная автокатегоризация для массового ввода расходов
 * @param expenses - массив расходов с описаниями
 * @returns массив результатов категоризации
 */
export async function batchAutoCategorize(
  expenses: Array<{ description?: string }>
): Promise<CategorizationResult[]> {
  const results: CategorizationResult[] = []
  
  for (const expense of expenses) {
    if (expense.description) {
      const result = await autoCategorizе(expense.description)
      results.push(result)
    } else {
      results.push({
        category_id: null,
        matched_keywords: [],
        auto_categorized: false
      })
    }
  }
  
  return results
}

/**
 * Получает статистику по автокатегоризации
 * @param results - результаты категоризации
 * @returns статистика
 */
export function getCategorizationStats(results: CategorizationResult[]) {
  const total = results.length
  const categorized = results.filter(r => r.category_id !== null).length
  const uncategorized = total - categorized

  return {
    total,
    categorized,
    uncategorized,
    categorizationRate: total > 0 ? (categorized / total) * 100 : 0
  }
}

// Все функции связанные с confidence удалены, так как мы больше не используем уверенность