/**
 * Утилиты для извлечения города из описания банковских выписок
 */

// Список известных городов Беларуси (можно расширять)
const BELARUS_CITIES = [
  'MINSK', 'МИНСК',
  'GOMEL', 'ГОМЕЛЬ', 
  'MOGILEV', 'МОГИЛЕВ',
  'VITEBSK', 'ВИТЕБСК',
  'GRODNO', 'ГРОДНО',
  'BREST', 'БРЕСТ',
  'LOGOYSK', 'ЛОГОЙСК',
  'BORISOV', 'БОРИСОВ',
  'BARANOVICHI', 'БАРАНОВИЧИ',
  'PINSK', 'ПИНСК',
  'ORSHA', 'ОРША',
  'MOZYR', 'МОЗЫРЬ',
  'NOVOPOLOTSK', 'НОВОПОЛОЦК',
  'LIDA', 'ЛИДА',
  'MOLODECHNO', 'МОЛОДЕЧНО',
  'SOLIGORSK', 'СОЛИГОРСК',
  'SLUTSK', 'СЛУЦК',
  'ZHLOBIN', 'ЖЛОБИН',
  'SVETLOGORSK', 'СВЕТЛОГОРСК',
  'RECHITSA', 'РЕЧИЦА',
  'BOBRUISK', 'БОБРУЙСК',
  'POLOTSK', 'ПОЛОЦК'
]

// Паттерны для поиска городов в описании
const CITY_PATTERNS = [
  // Паттерн: "BY НАЗВАНИЕ, ГОРОД" или "MN НАЗВАНИЕ, ГОРОД"
  /^(BY|MN)\s+(.+?),\s*([A-ZА-Я]+)$/i,
  
  // Паттерн: "BY НАЗВАНИЕ ГОРОД" (город в конце без запятой)
  /^(BY|MN)\s+(.+?)\s+([A-ZА-Я]+)$/i,
  
  // Паттерн: "ПРЕФИКС ГОРОДBY НАЗВАНИЕ" или "ПРЕФИКС ГОРОДMN НАЗВАНИЕ"
  /^(.+?)([A-ZА-Я]+)(BY|MN)\s+(.+)$/i,
  
  // Паттерн: город в кавычках или скобках
  /^(.+?)\s*[\("']([A-ZА-Я]+)[\)"'](.*)$/i,
  
  // Паттерн: город после запятой в любом месте
  /^(.+?),\s*([A-ZА-Я]+)(.*)$/i
]

export interface ParsedDescription {
  originalDescription: string
  cleanDescription: string
  city: string | null
  confidence: number // 0-1, насколько уверены в результате
}

/**
 * Извлекает город из описания банковской выписки
 */
export function extractCityFromDescription(description: string): ParsedDescription {
  if (!description || typeof description !== 'string') {
    return {
      originalDescription: description || '',
      cleanDescription: description || '',
      city: null,
      confidence: 0
    }
  }

  const originalDescription = description.trim()
  let bestMatch: ParsedDescription = {
    originalDescription,
    cleanDescription: originalDescription,
    city: null,
    confidence: 0
  }

  // Пробуем каждый паттерн
  for (const pattern of CITY_PATTERNS) {
    const match = originalDescription.match(pattern)
    if (!match) continue

    let potentialCity: string | null = null
    let cleanDescription = originalDescription
    let confidence = 0

    if (pattern === CITY_PATTERNS[0]) {
      // "BY НАЗВАНИЕ, ГОРОД" или "MN НАЗВАНИЕ, ГОРОД"
      const [, prefix, name, city] = match
      potentialCity = city.toUpperCase()
      cleanDescription = name.trim()
      confidence = 0.9
    } else if (pattern === CITY_PATTERNS[1]) {
      // "BY НАЗВАНИЕ ГОРОД"
      const [, prefix, name, city] = match
      potentialCity = city.toUpperCase()
      cleanDescription = name.trim()
      confidence = 0.8
    } else if (pattern === CITY_PATTERNS[2]) {
      // "ПРЕФИКС ГОРОДBY НАЗВАНИЕ"
      const [, prefix, city, suffix, name] = match
      potentialCity = city.toUpperCase()
      cleanDescription = name.trim()
      confidence = 0.7
    } else if (pattern === CITY_PATTERNS[3]) {
      // Город в кавычках или скобках
      const [, before, city, after] = match
      potentialCity = city.toUpperCase()
      cleanDescription = `${before.trim()} ${after.trim()}`.trim()
      confidence = 0.6
    } else if (pattern === CITY_PATTERNS[4]) {
      // Город после запятой
      const [, before, city, after] = match
      potentialCity = city.toUpperCase()
      cleanDescription = `${before.trim()} ${after.trim()}`.trim()
      confidence = 0.5
    }

    // Проверяем, является ли найденный текст известным городом
    if (potentialCity && BELARUS_CITIES.includes(potentialCity)) {
      confidence += 0.3 // Бонус за известный город
      
      if (confidence > bestMatch.confidence) {
        bestMatch = {
          originalDescription,
          cleanDescription: cleanDescription || originalDescription,
          city: potentialCity,
          confidence: Math.min(confidence, 1.0)
        }
      }
    }
  }

  // Дополнительная очистка описания
  if (bestMatch.cleanDescription) {
    bestMatch.cleanDescription = cleanDescription(bestMatch.cleanDescription)
  }

  return bestMatch
}

/**
 * Очищает описание от лишних символов и форматирует
 */
function cleanDescription(description: string): string {
  return description
    .replace(/^(BY|MN)\s+/i, '') // Убираем префиксы BY/MN
    .replace(/[",]/g, ' ') // Заменяем кавычки и запятые на пробелы
    .replace(/\s+/g, ' ') // Убираем множественные пробелы
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Капитализируем каждое слово
    .join(' ')
}

/**
 * Добавляет новый город в список известных городов
 */
export function addKnownCity(city: string): void {
  const upperCity = city.toUpperCase()
  if (!BELARUS_CITIES.includes(upperCity)) {
    BELARUS_CITIES.push(upperCity)
  }
}

/**
 * Получает список всех известных городов
 */
export function getKnownCities(): string[] {
  return [...BELARUS_CITIES]
}

/**
 * Проверяет, является ли строка известным городом
 */
export function isKnownCity(city: string): boolean {
  return BELARUS_CITIES.includes(city.toUpperCase())
}

/**
 * Пакетная обработка описаний для извлечения городов
 */
export function batchExtractCities(descriptions: string[]): ParsedDescription[] {
  return descriptions.map(desc => extractCityFromDescription(desc))
}

/**
 * Получает статистику по городам из массива описаний
 */
export function getCityStats(descriptions: string[]): Record<string, number> {
  const stats: Record<string, number> = {}
  
  descriptions.forEach(desc => {
    const parsed = extractCityFromDescription(desc)
    if (parsed.city && parsed.confidence > 0.5) {
      stats[parsed.city] = (stats[parsed.city] || 0) + 1
    }
  })
  
  return stats
}