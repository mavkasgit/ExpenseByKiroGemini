'use client'

import { useMemo, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import {
  CITY_PATTERN_DEFINITIONS,
  extractCityFromDescription,
  type CityPatternId,
  type ExtractCityOptions
} from '@/lib/utils/cityParser'

const SAMPLE_TEXT = `BY COFFEEBAR, MINSK\nMN SUPERMARKET GRODNO\nОплата услуг "Brest" ул. Пушкинская\nBY SERVICE STATION, BORISOV`

type PatternWeightsState = Record<CityPatternId, number>

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

export default function ParserTestPage() {
  const [sourceText, setSourceText] = useState<string>(SAMPLE_TEXT)
  const [patternWeights, setPatternWeights] = useState<PatternWeightsState>(() => {
    const initial = {} as PatternWeightsState
    CITY_PATTERN_DEFINITIONS.forEach(definition => {
      initial[definition.id] = 1
    })
    return initial
  })
  const [synonymBoost, setSynonymBoost] = useState<number>(0.2)
  const [knownCityBoost, setKnownCityBoost] = useState<number>(0.3)
  const [minConfidence, setMinConfidence] = useState<number>(0)
  const [cleanResult, setCleanResult] = useState<boolean>(true)

  const patternMeta = useMemo(() => {
    const map = new Map<CityPatternId, (typeof CITY_PATTERN_DEFINITIONS)[number]>()
    CITY_PATTERN_DEFINITIONS.forEach(definition => {
      map.set(definition.id, definition)
    })
    return map
  }, [])

  const lines = useMemo(() => (
    sourceText
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0)
  ), [sourceText])

  const results = useMemo(() => {
    const options: ExtractCityOptions = {
      patternWeights,
      synonymBoost,
      knownCityBoost,
      minConfidence,
      cleanResult
    }

    return lines.map(line => ({
      original: line,
      parsed: extractCityFromDescription(line, options)
    }))
  }, [lines, patternWeights, synonymBoost, knownCityBoost, minConfidence, cleanResult])

  const recognizedCount = useMemo(
    () =>
      results.filter(result =>
        Boolean(result.parsed.city) && result.parsed.confidence >= minConfidence
      ).length,
    [results, minConfidence]
  )

  const handlePatternWeightChange = (patternId: CityPatternId, value: string) => {
    const numeric = Number.parseFloat(value)
    if (Number.isNaN(numeric) || numeric < 0) {
      setPatternWeights(prev => ({ ...prev, [patternId]: 0 }))
      return
    }
    setPatternWeights(prev => ({ ...prev, [patternId]: Number.isFinite(numeric) ? numeric : prev[patternId] }))
  }

  const resetAdjustments = () => {
    setPatternWeights(() => {
      const next = {} as PatternWeightsState
      CITY_PATTERN_DEFINITIONS.forEach(definition => {
        next[definition.id] = 1
      })
      return next
    })
    setSynonymBoost(0.2)
    setKnownCityBoost(0.3)
    setMinConfidence(0)
    setCleanResult(true)
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Тестирование парсинга городов из описаний</CardTitle>
          <CardDescription>
            Вставьте строки из банковской выписки, чтобы увидеть, как текущие правила выделяют город и очищают описание.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            value={sourceText}
            onChange={event => setSourceText(event.target.value)}
            className="min-h-[160px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="BY COMPANY, MINSK"
            spellCheck={false}
            autoComplete="off"
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-gray-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">Всего строк</p>
              <p className="text-2xl font-semibold text-gray-900">{lines.length}</p>
            </div>
            <div className="rounded-lg bg-green-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-green-600">С определённым городом</p>
              <p className="text-2xl font-semibold text-green-700">{recognizedCount}</p>
            </div>
            <div className="rounded-lg bg-indigo-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-indigo-600">Текущий порог уверенности</p>
              <p className="text-2xl font-semibold text-indigo-700">{formatPercent(minConfidence)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Регулировка правил</CardTitle>
            <CardDescription>
              Изменяйте веса шаблонов и коэффициенты, чтобы подобрать оптимальную чувствительность парсера.
            </CardDescription>
          </div>
          <Button variant="ghost" onClick={resetAdjustments}>
            Сбросить настройки
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {CITY_PATTERN_DEFINITIONS.map(definition => (
              <div key={definition.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">{definition.label}</h3>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                    {formatPercent(definition.baseConfidence)} базово
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-500">{definition.description}</p>
                <div className="mt-3">
                  <Input
                    type="number"
                    label="Вес шаблона"
                    min={0}
                    step={0.1}
                    value={patternWeights[definition.id]}
                    onChange={event => handlePatternWeightChange(definition.id, event.target.value)}
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    0 отключит шаблон, значения &gt; 1 усиливают доверие.
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <label className="text-sm font-medium text-gray-900" htmlFor="synonym-boost">
                Бонус за совпадение с синонимом
              </label>
              <Input
                id="synonym-boost"
                type="number"
                min={0}
                step={0.05}
                value={synonymBoost}
                onChange={event => setSynonymBoost(Number.parseFloat(event.target.value) || 0)}
                className="mt-2"
              />
              <p className="mt-1 text-[11px] text-gray-400">Добавляется к уверенности, когда найден синоним.</p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <label className="text-sm font-medium text-gray-900" htmlFor="known-boost">
                Бонус за точное совпадение
              </label>
              <Input
                id="known-boost"
                type="number"
                min={0}
                step={0.05}
                value={knownCityBoost}
                onChange={event => setKnownCityBoost(Number.parseFloat(event.target.value) || 0)}
                className="mt-2"
              />
              <p className="mt-1 text-[11px] text-gray-400">Добавляется, если город найден в справочнике.</p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <label className="text-sm font-medium text-gray-900" htmlFor="min-confidence">
                Минимальная уверенность
              </label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  id="min-confidence"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={minConfidence}
                  onChange={event => setMinConfidence(Number.parseFloat(event.target.value) || 0)}
                  className="flex-1"
                />
                <span className="w-14 text-right text-sm font-medium text-gray-700">
                  {formatPercent(minConfidence)}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-gray-400">Записи ниже порога будут отмечены как сомнительные.</p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <label className="text-sm font-medium text-gray-900">Очистка описания</label>
              <div className="mt-3 flex items-center gap-2">
                <input
                  id="clean-result"
                  type="checkbox"
                  checked={cleanResult}
                  onChange={event => setCleanResult(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="clean-result" className="text-sm text-gray-700">
                  Применять автоматическое форматирование (убрать BY/MN, привести регистр)
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Результаты разборки</CardTitle>
          <CardDescription>
            Ниже отображаются очищенные описания, выбранный город и детали срабатывания правил для каждой строки.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium uppercase tracking-wide text-gray-500">#</th>
                <th className="px-3 py-2 text-left font-medium uppercase tracking-wide text-gray-500">Исходная строка</th>
                <th className="px-3 py-2 text-left font-medium uppercase tracking-wide text-gray-500">Очищенное описание</th>
                <th className="px-3 py-2 text-left font-medium uppercase tracking-wide text-gray-500">Город</th>
                <th className="px-3 py-2 text-left font-medium uppercase tracking-wide text-gray-500">Уверенность</th>
                <th className="px-3 py-2 text-left font-medium uppercase tracking-wide text-gray-500">Паттерн</th>
                <th className="px-3 py-2 text-left font-medium uppercase tracking-wide text-gray-500">Синоним</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {results.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-sm text-gray-500">
                    Добавьте хотя бы одну строку для анализа.
                  </td>
                </tr>
              ) : (
                results.map((result, index) => {
                  const { parsed } = result
                  const isRecognized = Boolean(parsed.city)
                  const patternInfo = parsed.patternId ? patternMeta.get(parsed.patternId) : null
                  const confidenceBadge = isRecognized
                    ? parsed.confidence >= minConfidence
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : 'bg-amber-100 text-amber-700 border-amber-200'
                    : 'bg-gray-100 text-gray-500 border-gray-200'

                  return (
                    <tr key={`${result.original}-${index}`} className={isRecognized ? 'bg-white' : 'bg-red-50/40'}>
                      <td className="px-3 py-2 align-top text-gray-500">{index + 1}</td>
                      <td className="px-3 py-2 align-top text-gray-900">
                        <span className="whitespace-pre-wrap break-words text-sm">{result.original}</span>
                      </td>
                      <td className="px-3 py-2 align-top text-gray-700">
                        {parsed.cleanDescription ? (
                          <span className="whitespace-pre-wrap break-words">{parsed.cleanDescription}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 align-top">
                        {isRecognized ? (
                          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                            📍 {parsed.displayCity || parsed.city}
                          </span>
                        ) : (
                          <span className="text-sm text-red-500">Не найдено</span>
                        )}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${confidenceBadge}`}>
                          {formatPercent(parsed.confidence)}
                          {parsed.baseConfidence !== undefined && (
                            <span className="text-[11px] text-gray-500">
                              базово {formatPercent(parsed.baseConfidence)} × {parsed.appliedWeight?.toFixed(2) ?? '1.00'}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top text-gray-700">
                        {patternInfo ? (
                          <div className="flex flex-col text-xs text-gray-600">
                            <span className="font-medium text-gray-800">{patternInfo.label}</span>
                            <span>{patternInfo.description}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 align-top text-gray-600">
                        {parsed.matchedSynonym ? (
                          <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] text-blue-700">
                            {parsed.matchedSynonym}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
