import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type CurrencyFormatMode = 'currency' | 'code' | 'name' | 'plain'

interface FormatCurrencyOptions {
  locale?: string
  currency?: string
  mode?: CurrencyFormatMode
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

export function formatCurrency(amount: number, options: FormatCurrencyOptions = {}): string {
  const {
    locale = 'ru-RU',
    currency = 'RUB',
    mode = 'currency',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options

  if (mode === 'plain') {
    return new Intl.NumberFormat(locale, {
      style: 'decimal',
      minimumFractionDigits,
      maximumFractionDigits
    }).format(amount)
  }

  const currencyDisplay = mode === 'currency' ? 'symbol' : mode

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay,
    minimumFractionDigits,
    maximumFractionDigits
  }).format(amount)
}

interface FormatDateOptions extends Intl.DateTimeFormatOptions {
  locale?: string
}

export function formatDate(date: string | Date, options: FormatDateOptions = {}): string {
  const { locale = 'ru-RU', ...formatOptions } = options

  const dateInstance = date instanceof Date ? date : new Date(date)

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...formatOptions
  }).format(dateInstance)
}

import type { CategoryKeywordWithSynonyms, KeywordSynonym } from "@/types"

export const normalizeKeywords = (
  keywords: any[] = [],
): CategoryKeywordWithSynonyms[] =>
  keywords.map((keyword) => ({
    ...keyword,
    keyword_synonyms: (keyword.keyword_synonyms || []).map((synonym: Partial<KeywordSynonym>) => ({
      ...synonym,
      keyword_id: (synonym as KeywordSynonym).keyword_id ?? keyword.id ?? null,
      user_id: (synonym as KeywordSynonym).user_id ?? keyword.user_id ?? null,
    })),
  })) as CategoryKeywordWithSynonyms[];