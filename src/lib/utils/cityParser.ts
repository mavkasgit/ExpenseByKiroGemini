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

type CitySynonymLookupValue = {
  canonical: string
  canonicalDisplay: string
  synonymDisplay: string
}

const citySynonymLookup = new Map<string, CitySynonymLookupValue>()
const canonicalCityDisplay = new Map<string, string>()

export type CityPatternId =
  | 'prefix_comma'
  | 'prefix_suffix'
  | 'embedded_suffix'
  | 'quoted_city'
  | 'comma_anywhere'

interface CityPatternDefinition {
  id: CityPatternId
  label: string
  description: string
  regex: RegExp
  baseConfidence: number
  extract: (match: RegExpMatchArray) => { city: string; cleanDescription: string } | null
}

// Паттерны для поиска городов в описании
export const CITY_PATTERN_DEFINITIONS: CityPatternDefinition[] = [
  {
    id: 'prefix_comma',
    label: 'BY/MN + описание, ГОРОД',
    description: 'Город указан после запятой и префикса BY или MN',
    regex: /^(BY|MN)\s+(.+?),\s*([A-ZА-Я]+)$/i,
    baseConfidence: 0.9,
    extract: match => {
      const [, , name, city] = match
      if (!city) return null
      return {
        city: city.toUpperCase(),
        cleanDescription: name?.trim() || ''
      }
    }
  },
  {
    id: 'prefix_suffix',
    label: 'BY/MN + описание + ГОРОД',
    description: 'Город стоит в конце строки без запятой',
    regex: /^(BY|MN)\s+(.+?)\s+([A-ZА-Я]+)$/i,
    baseConfidence: 0.8,
    extract: match => {
      const [, , name, city] = match
      if (!city) return null
      return {
        city: city.toUpperCase(),
        cleanDescription: name?.trim() || ''
      }
    }
  },
  {
    id: 'embedded_suffix',
    label: '...ГОРОДBY описание',
    description: 'Город стоит перед суффиксом BY/MN и описанием',
    regex: /^(.+?)([A-ZА-Я]+)(BY|MN)\s+(.+)$/i,
    baseConfidence: 0.7,
    extract: match => {
      const [, , city, , name] = match
      if (!city) return null
      return {
        city: city.toUpperCase(),
        cleanDescription: name?.trim() || ''
      }
    }
  },
  {
    id: 'quoted_city',
    label: 'Описание "ГОРОД" ...',
    description: 'Город выделен кавычками или скобками внутри строки',
    regex: /^(.+?)\s*[\("']([A-ZА-Я]+)[\)"'](.*)$/i,
    baseConfidence: 0.6,
    extract: match => {
      const [, before, city, after] = match
      if (!city) return null
      const combined = `${before?.trim() || ''} ${after?.trim() || ''}`.trim()
      return {
        city: city.toUpperCase(),
        cleanDescription: combined
      }
    }
  },
  {
    id: 'comma_anywhere',
    label: 'Описание, ГОРОД ...',
    description: 'Город указан через запятую в середине текста',
    regex: /^(.+?),\s*([A-ZА-Я]+)(.*)$/i,
    baseConfidence: 0.5,
    extract: match => {
      const [, before, city, after] = match
      if (!city) return null
      const combined = `${before?.trim() || ''} ${after?.trim() || ''}`.trim()
      return {
        city: city.toUpperCase(),
        cleanDescription: combined
      }
    }
  }
]

function formatCityDisplay(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function resolveCityVariant(city: string) {
  const normalized = city.trim().toUpperCase()
  if (!normalized) {
    return null
  }

  const synonymRecord = citySynonymLookup.get(normalized)
  if (synonymRecord) {
    return {
      canonical: synonymRecord.canonical,
      display: `${synonymRecord.canonicalDisplay} (${synonymRecord.synonymDisplay})`,
      isSynonym: true,
      synonymDisplay: synonymRecord.synonymDisplay
    }
  }

  if (BELARUS_CITIES.includes(normalized)) {
    const display = canonicalCityDisplay.get(normalized) || formatCityDisplay(normalized)
    return {
      canonical: normalized,
      display,
      isSynonym: false
    }
  }

  return null
}

export function syncCitySynonyms(records: Array<{ city: string; synonym: string }>) {
  citySynonymLookup.clear()

  for (const record of records) {
    const canonicalOriginal = record.city?.trim()
    const synonymOriginal = record.synonym?.trim()
    if (!canonicalOriginal || !synonymOriginal) {
      continue
    }

    const canonicalUpper = canonicalOriginal.toUpperCase()
    const synonymUpper = synonymOriginal.toUpperCase()

    addKnownCity(canonicalOriginal)

    const canonicalDisplay = formatCityDisplay(canonicalOriginal)
    canonicalCityDisplay.set(canonicalUpper, canonicalDisplay)

    const synonymDisplay = formatCityDisplay(synonymOriginal)
    citySynonymLookup.set(synonymUpper, {
      canonical: canonicalUpper,
      canonicalDisplay,
      synonymDisplay
    })
  }
}

export interface ParsedDescription {
  originalDescription: string
  cleanDescription: string
  city: string | null
  displayCity: string | null
  matchedSynonym?: string | null
  confidence: number // 0-1, насколько уверены в результате
  patternId?: CityPatternId | null
  baseConfidence?: number
  appliedWeight?: number
}

export interface ExtractCityOptions {
  patternWeights?: Partial<Record<CityPatternId, number>>
  synonymBoost?: number
  knownCityBoost?: number
  minConfidence?: number
  cleanResult?: boolean
}

/**
 * Извлекает город из описания банковской выписки
 */
export function extractCityFromDescription(description: string, options?: ExtractCityOptions): ParsedDescription {
  if (!description || typeof description !== 'string') {
    return {
      originalDescription: description || '',
      cleanDescription: description || '',
      city: null,
      displayCity: null,
      confidence: 0,
      patternId: null,
      baseConfidence: undefined,
      appliedWeight: undefined
    }
  }

  const originalDescription = description.trim()
  let bestMatch: ParsedDescription = {
    originalDescription,
    cleanDescription: originalDescription,
    city: null,
    displayCity: null,
    matchedSynonym: null,
    confidence: 0,
    patternId: null,
    baseConfidence: undefined,
    appliedWeight: undefined
  }

  const patternWeights = options?.patternWeights ?? {}
  const synonymBoost = options?.synonymBoost ?? 0.2
  const knownCityBoost = options?.knownCityBoost ?? 0.3
  const minConfidence = options?.minConfidence ?? 0
  const shouldClean = options?.cleanResult !== false

  // Пробуем каждый паттерн
  for (const definition of CITY_PATTERN_DEFINITIONS) {
    const match = originalDescription.match(definition.regex)
    if (!match) continue

    const extracted = definition.extract(match)
    if (!extracted) continue

    let potentialCity = extracted.city.trim()
    const candidateDescription = extracted.cleanDescription?.trim() || originalDescription

    const weight = patternWeights[definition.id]
    const appliedWeight = typeof weight === 'number' && !Number.isNaN(weight) ? Math.max(weight, 0) : 1
    let confidence = definition.baseConfidence * appliedWeight

    const resolved = resolveCityVariant(potentialCity)
    if (!resolved) {
      continue
    }

    confidence += resolved.isSynonym ? synonymBoost : knownCityBoost
    if (confidence < minConfidence) {
      continue
    }

    if (confidence > bestMatch.confidence) {
      potentialCity = resolved.canonical
      bestMatch = {
        originalDescription,
        cleanDescription: candidateDescription || originalDescription,
        city: potentialCity,
        displayCity: resolved.display,
        matchedSynonym: resolved.isSynonym ? resolved.synonymDisplay || resolved.display : null,
        confidence: Math.min(confidence, 1.0),
        patternId: definition.id,
        baseConfidence: definition.baseConfidence,
        appliedWeight
      }
    }
  }

  // Дополнительная очистка описания
  if (bestMatch.cleanDescription) {
    bestMatch.cleanDescription = shouldClean
      ? cleanDescription(bestMatch.cleanDescription)
      : bestMatch.cleanDescription.trim()
  }

  if (bestMatch.city && !bestMatch.displayCity) {
    bestMatch.displayCity = canonicalCityDisplay.get(bestMatch.city) || formatCityDisplay(bestMatch.city)
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
  if (!city) return
  const trimmed = city.trim()
  if (!trimmed) return

  const upperCity = trimmed.toUpperCase()
  if (!BELARUS_CITIES.includes(upperCity)) {
    BELARUS_CITIES.push(upperCity)
  }

  if (!canonicalCityDisplay.has(upperCity)) {
    canonicalCityDisplay.set(upperCity, formatCityDisplay(trimmed))
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
export function batchExtractCities(descriptions: string[], options?: ExtractCityOptions): ParsedDescription[] {
  return descriptions.map(desc => extractCityFromDescription(desc, options))
}

/**
 * Получает статистику по городам из массива описаний
 */
export function getCityStats(descriptions: string[]): Record<string, number> {
  const stats = new Map<string, { count: number; display: string }>()

  descriptions.forEach(desc => {
    const parsed = extractCityFromDescription(desc)
    if (parsed.city && parsed.confidence > 0.5) {
      const key = parsed.city
      const display = parsed.displayCity || canonicalCityDisplay.get(key) || formatCityDisplay(key)
      const existing = stats.get(key)
      if (existing) {
        existing.count += 1
      } else {
        stats.set(key, { count: 1, display })
      }
    }
  })

  const result: Record<string, number> = {}
  stats.forEach(({ display, count }) => {
    result[display] = count
  })

  return result
}