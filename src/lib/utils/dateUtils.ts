/**
 * Утилиты для работы с датами в русском формате
 */

/**
 * Форматирует дату в русском формате DD.MM.YYYY
 */
export function formatDateRu(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return ''
  }
  
  const day = dateObj.getDate().toString().padStart(2, '0')
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
  const year = dateObj.getFullYear()
  
  return `${day}.${month}.${year}`
}

/**
 * Парсит дату из русского формата DD.MM.YYYY в ISO строку
 */
export function parseDateRu(dateStr: string): string {
  const cleanDate = dateStr.trim()
  
  // Проверяем формат DD.MM.YYYY
  const match = cleanDate.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (match) {
    const [, day, month, year] = match
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    
    if (!isNaN(date.getTime()) && 
        date.getDate() === parseInt(day) && 
        date.getMonth() === parseInt(month) - 1 && 
        date.getFullYear() === parseInt(year)) {
      return date.toISOString().split('T')[0]
    }
  }
  
  // Если не удалось распарсить, возвращаем текущую дату
  return new Date().toISOString().split('T')[0]
}

/**
 * Получает текущую дату в ISO формате
 */
export function getCurrentDateISO(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Получает текущее время в формате HH:MM
 */
export function getCurrentTimeHHMM(): string {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * Форматирует дату для отображения с использованием русской локали
 */
export function formatDateLocaleRu(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return ''
  }
  
  return dateObj.toLocaleDateString('ru-RU')
}

/**
 * Названия месяцев на русском языке
 */
export const MONTH_NAMES_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
]

/**
 * Сокращенные названия дней недели на русском языке (начиная с понедельника)
 */
export const WEEK_DAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']