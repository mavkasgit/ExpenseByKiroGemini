/**
 * Форматирует число для отображения с удалением лишних нулей
 * @param value - число для форматирования
 * @returns отформатированная строка
 */
export function formatAmount(value: number): string {
  // Округляем до 2 знаков после запятой
  const rounded = Math.round(value * 100) / 100
  
  // Преобразуем в строку с 2 знаками после запятой
  const formatted = rounded.toFixed(2)
  
  // Убираем лишние нули в конце
  return formatted.replace(/\.?0+$/, '')
}

/**
 * Форматирует число для ввода в поля формы
 * @param value - число для форматирования
 * @returns строка для input поля
 */
export function formatAmountForInput(value: number): string {
  if (value === 0) return ''
  return formatAmount(value)
}