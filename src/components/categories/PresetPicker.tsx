'use client'

import { useState } from 'react'
import { presets } from '@/lib/presets'
import { applyPreset } from '@/lib/actions/presets'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  useToast
} from '@/components/ui'
import type { Category, CategoryGroup } from '@/types';

interface PresetPickerProps {
  onSuccess: (newGroups: CategoryGroup[], newCategories: Category[]) => void
}

const highlightBadges = [
  'Быстрый старт',
  'Золотая середина',
  'Максимум контроля'
] as const

export function PresetPicker({ onSuccess }: PresetPickerProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const toast = useToast()

  const handlePresetSelect = async (presetName: string) => {
    setIsLoading(presetName)
    try {
      const result = await applyPreset(presetName)
      if (result.success) {
        toast.success(`Пресет "${presetName}" успешно применен!`)
        onSuccess(result.newGroups, result.newCategories)
      } else {
        toast.error(result.error || 'Неизвестная ошибка при применении пресета')
      }
    } catch (error: any) {
      toast.error(error.message || 'Произошла непредвиденная ошибка')
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <section className="relative w-full overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-sky-50 py-16">
      <div
        className="pointer-events-none absolute left-1/2 top-[-8rem] h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-200/40 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 right-12 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full border border-indigo-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Библиотека пресетов
          </span>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Начните с красивого шаблона и адаптируйте его под себя
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Подберите готовый сценарий: от лёгкого старта до детальной аналитики. Все группы и категории можно донастроить после применения.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {presets.map((preset, index) => {
            const badgeLabel = highlightBadges[index] ?? 'Готовое решение'

            return (
              <Card
                key={preset.name}
                variant="elevated"
                className="group relative h-full overflow-hidden border-none bg-white/80 p-0 shadow-xl ring-1 ring-slate-900/5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-sky-400/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-indigo-400/10 blur-3xl transition-transform duration-500 group-hover:scale-110"
                  aria-hidden
                />

                <div className="relative flex h-full flex-col">
                  <CardHeader className="flex flex-col gap-4 border-b border-white/60 bg-white/70 px-6 pb-6 pt-6">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-5xl leading-none">{preset.emoji}</span>
                      <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
                        {badgeLabel}
                      </span>
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-2xl text-slate-900">{preset.name}</CardTitle>
                      <CardDescription className="mt-1 text-base text-slate-600">
                        {preset.description}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                        <span className="inline-flex h-2 w-2 rounded-full bg-indigo-500" aria-hidden />
                        {preset.groups.length} групп
                      </span>
                      <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                        {preset.categories.length} категорий
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="relative flex flex-1 flex-col gap-6 px-6 py-6">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Группы</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {preset.groups.slice(0, 6).map(group => (
                          <span
                            key={group.name}
                            className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm"
                          >
                            {group.name}
                          </span>
                        ))}
                        {preset.groups.length > 6 && (
                          <span className="inline-flex items-center rounded-full bg-slate-200/80 px-3 py-1 text-xs font-medium text-slate-600">
                            + ещё {preset.groups.length - 6}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Категории</h3>
                      <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600">
                        {preset.categories.slice(0, 5).map(category => (
                          <div
                            key={category.name}
                            className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white/90 px-3 py-2 shadow-sm"
                          >
                            <span className="font-medium text-slate-700">{category.name}</span>
                            <span className="text-xs text-slate-400">{category.group}</span>
                          </div>
                        ))}
                      </div>
                      {preset.categories.length > 5 && (
                        <p className="mt-2 text-xs text-slate-400">
                          ... и ещё {preset.categories.length - 5} категорий
                        </p>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="relative mt-auto border-t border-slate-100/80 bg-slate-50/80 px-6 py-5">
                    <Button
                      variant="primary"
                      className="w-full justify-center text-sm font-semibold shadow-lg shadow-indigo-500/10"
                      onClick={() => handlePresetSelect(preset.name)}
                      isLoading={isLoading === preset.name}
                    >
                      {isLoading === preset.name ? 'Создаем...' : `Выбрать «${preset.name}»`}
                    </Button>
                  </CardFooter>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
