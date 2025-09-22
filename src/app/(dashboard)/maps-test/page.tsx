// src/app/(dashboard)/maps-test/page.tsx

'use client'

import { useState, type KeyboardEvent } from 'react';
import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

// Тип для состояния карты
interface MapState {
  center: [number, number];
  zoom: number;
  placemark?: [number, number];
}

export default function MapsTestPage() {
  const [searchQuery, setSearchQuery] = useState<string>('Минск');
  const [mapState, setMapState] = useState<MapState>({
    center: [55.751574, 37.573856], // По умолчанию Москва
    zoom: 4,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const yandexApiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      showToast('Введите название города', 'warning');
      return;
    }
    if (!yandexApiKey) {
      showToast('API ключ для Яндекс Карт не найден', 'error');
      console.error('Yandex Maps API key is missing. Please check your .env.local file.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://geocode-maps.yandex.ru/1.x/?apikey=${yandexApiKey}&format=json&geocode=${encodeURIComponent(
          searchQuery
        )}`
      );
      const data = await response.json();

      const geoObjects = data.response.GeoObjectCollection.featureMember;
      if (geoObjects.length > 0) {
        const point = geoObjects[0].GeoObject.Point.pos;
        const [lon, lat] = point.split(' ').map(Number);
        
        setMapState({
          center: [lat, lon],
          zoom: 10,
          placemark: [lat, lon],
        });
        showToast(`Город ${searchQuery} найден!`, 'success');
      } else {
        showToast(`Город "${searchQuery}" не найден`, 'error');
      }
    } catch (error) {
      console.error('Geocoding API error:', error);
      showToast('Произошла ошибка при поиске города', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Тестирование Яндекс Карт</CardTitle>
          <CardDescription>
            Введите название города, чтобы найти его на карте.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Название города..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSearch} isLoading={isLoading}>
              {isLoading ? 'Поиск...' : 'Найти город'}
            </Button>
          </div>

          <div className="h-[500px] w-full bg-gray-200 rounded-lg overflow-hidden">
            {yandexApiKey ? (
              <YMaps query={{ apikey: yandexApiKey, lang: 'ru_RU' }}>
                <Map
                  state={mapState}
                  width="100%"
                  height="100%"
                  modules={['geoObject.addon.balloon', 'geoObject.addon.hint']}
                >
                  {mapState.placemark && (
                    <Placemark
                      geometry={mapState.placemark}
                      properties={{
                        balloonContentHeader: searchQuery,
                        balloonContentBody: `Координаты: ${mapState.placemark[0].toFixed(4)}, ${mapState.placemark[1].toFixed(4)}`,
                      }}
                    />
                  )}
                </Map>
              </YMaps>
            ) : (
              <div className="flex items-center justify-center h-full text-red-600">
                API-ключ для Яндекс Карт не настроен.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
