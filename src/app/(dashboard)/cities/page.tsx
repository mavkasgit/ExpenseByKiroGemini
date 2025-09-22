// src/app/(dashboard)/cities/page.tsx
'use client'; // Временно делаем страницу клиентской для простоты
import { StickyPageHeader } from '@/components/layout/StickyPageHeader';
import { CitySynonymManager } from '@/components/settings/CitySynonymManager';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { YMaps, Map } from '@pbe/react-yandex-maps';
// На этом шаге мы используем 'use client' для простоты.
// На следующих шагах мы вернемся к серверному компоненту.
export default function CitiesPage() {
  const yandexApiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;
  const mapState = {
    center: [55.75, 37.62], // Центр Москвы
    zoom: 4,
  };
  return (
    <div className="min-h-screen bg-slate-50">
      <StickyPageHeader
        title="Города и синонимы"
        description="Управляйте городами и анализируйте географию ваших расходов."
      />
      <main className="container mx-auto grid gap-6 px-4 pb-12 pt-6">
        <Card>
          <CardHeader>
            <CardTitle>Карта расходов</CardTitle>
            <CardDescription>
              Визуализация городов, в которых вы совершали траты.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full overflow-hidden rounded-lg border">
              {yandexApiKey ? (
                <YMaps query={{ apikey: yandexApiKey, lang: 'ru_RU' }}>
                  <Map state={mapState} width="100%" height="100%" />
                </YMaps>
              ) : (
                <div className="flex h-full items-center justify-center bg-red-50 text-red-700">
                  Ошибка: API-ключ для Яндекс Карт не настроен.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <CitySynonymManager />
      </main>
    </div>
  );
}
