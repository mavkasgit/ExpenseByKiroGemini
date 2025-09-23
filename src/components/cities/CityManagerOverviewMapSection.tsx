'use client';

import { YMaps, Map as YandexMap, Placemark } from '@pbe/react-yandex-maps';
import { DEFAULT_MARKER_PRESET } from '@/lib/constants/cityMarkers';
import type { CityCoordinates } from '@/lib/utils/cityCoordinates';
import type { CityGroupWithCoordinates } from './cityManagerTypes';
import type { MapState } from './cityManagerUtils';

interface CityManagerOverviewMapSectionProps {
  yandexApiKey?: string;
  citiesWithCoordinates: CityGroupWithCoordinates[];
  overviewMapState: MapState;
  onMapInstanceChange: (ref: unknown) => void;
  formatCityCoordinates: (coords: CityCoordinates | null) => string;
}

export function CityManagerOverviewMapSection({
  yandexApiKey,
  citiesWithCoordinates,
  overviewMapState,
  onMapInstanceChange,
  formatCityCoordinates,
}: CityManagerOverviewMapSectionProps) {
  return (
    <div className="flex flex-grow flex-col space-y-2 rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Карта всех городов</p>
      <div className="h-[400px] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
        {yandexApiKey ? (
          citiesWithCoordinates.length > 0 ? (
            <YMaps query={{ apikey: yandexApiKey, lang: 'ru_RU' }}>
              <YandexMap
                state={overviewMapState}
                width="100%"
                height="100%"
                modules={['geoObject.addon.balloon', 'geoObject.addon.hint']}
                instanceRef={onMapInstanceChange}
              >
                {citiesWithCoordinates.map(city => (
                  <Placemark
                    key={city.cityId}
                    geometry={[city.coordinates.lat, city.coordinates.lon]}
                    properties={{
                      balloonContent: `<strong>${city.cityName}</strong><br/>${formatCityCoordinates(city.coordinates)}`,
                      hintContent: `${city.cityName} (${formatCityCoordinates(city.coordinates)})`
                    }}
                    options={{ preset: city.coordinates.markerPreset ?? DEFAULT_MARKER_PRESET }}
                  />
                ))}
              </YandexMap>
            </YMaps>
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-500">
              Для отображения на карте добавьте координаты городов.
            </div>
          )
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-red-700">
            API-ключ для Яндекс Карт не настроен. Карта городов недоступна.
          </div>
        )}
      </div>
      <p className="text-xs text-slate-500">На карте отображаются все города с заданными координатами.</p>
    </div>
  );
}
