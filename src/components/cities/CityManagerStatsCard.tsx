'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

interface CityManagerStatsCardProps {
  totalCities: number;
  totalSynonyms: number;
  customSynonyms: number;
  coverage: number;
}

export function CityManagerStatsCard({ totalCities, totalSynonyms, customSynonyms, coverage }: CityManagerStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Статистика справочника</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex items-baseline justify-between rounded-lg border border-slate-200 px-3 py-2">
          <span className="text-sm text-slate-500">Городов</span>
          <span className="text-lg font-semibold text-slate-900">{totalCities}</span>
        </div>
        <div className="flex items-baseline justify-between rounded-lg border border-slate-200 px-3 py-2">
          <span className="text-sm text-slate-500">Всего записей</span>
          <span className="text-lg font-semibold text-slate-900">{totalSynonyms}</span>
        </div>
        <div className="flex items-baseline justify-between rounded-lg border border-slate-200 px-3 py-2">
          <span className="text-sm text-slate-500">Альтернативных вариантов</span>
          <span className="text-lg font-semibold text-slate-900">{customSynonyms}</span>
        </div>
        <div className="flex items-baseline justify-between rounded-lg border border-slate-200 px-3 py-2">
          <span className="text-sm text-slate-500">Покрытие</span>
          <span className="text-lg font-semibold text-slate-900">{coverage}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
