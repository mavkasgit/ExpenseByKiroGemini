// Извлечение ключевых слов из описания
export function extractKeywords(description: string): string[] {
  if (!description) return []
  
  // Простое извлечение ключевых слов
  // Удаляем знаки препинания, приводим к нижнему регистру, разбиваем на слова
  const words = description
    .toLowerCase()
    .replace(/[^\w\s\u0400-\u04FF]/g, '') // оставляем только буквы, цифры, пробелы и кириллицу
    .split(/\s+/)
    .filter(word => word.length > 2) // исключаем слишком короткие слова
    .filter(word => !isStopWord(word)) // исключаем стоп-слова
  
  // Удаляем дубликаты
  return [...new Set(words)]
}

// Стоп-слова (можно расширить)
function isStopWord(word: string): boolean {
  const stopWords = new Set([
    'и', 'в', 'на', 'с', 'по', 'для', 'от', 'до', 'из', 'к', 'о', 'об', 'за', 'под', 'над', 'при', 'без',
    'через', 'между', 'среди', 'около', 'возле', 'вокруг', 'после', 'перед', 'во', 'со', 'ко', 'ото',
    'что', 'как', 'где', 'когда', 'почему', 'зачем', 'куда', 'откуда', 'сколько', 'который', 'какой',
    'чей', 'чья', 'чьё', 'чьи', 'этот', 'эта', 'это', 'эти', 'тот', 'та', 'то', 'те', 'такой', 'такая',
    'такое', 'такие', 'весь', 'вся', 'всё', 'все', 'каждый', 'каждая', 'каждое', 'каждые', 'любой',
    'любая', 'любое', 'любые', 'другой', 'другая', 'другое', 'другие', 'один', 'одна', 'одно', 'одни',
    'два', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять', 'десять'
  ])
  
  return stopWords.has(word)
}

// Нормализация ключевого слова
export function normalizeKeyword(keyword: string): string {
  return keyword.toLowerCase().trim()
}

// Проверка валидности ключевого слова
export function isValidKeyword(keyword: string): boolean {
  const normalized = normalizeKeyword(keyword)
  return normalized.length > 2 && !isStopWord(normalized)
}

// Извлечение и фильтрация ключевых слов
export function extractValidKeywords(description: string): string[] {
  const keywords = extractKeywords(description)
  return keywords.filter(isValidKeyword)
}