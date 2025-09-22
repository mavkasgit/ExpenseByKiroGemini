'use client';

import { Fragment, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Polygon = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polygon),
  { ssr: false }
);

const cityData = [
  {
    name: 'Москва',
    region: 'Россия',
    coordinates: [55.751244, 37.618423] as [number, number],
    population: '13.1 млн человек',
    description:
      'Столица России, крупнейший финансовый, культурный и образовательный центр страны.',
    boundary: [
      [55.495, 37.325],
      [55.495, 37.945],
      [55.951, 37.945],
      [55.951, 37.325],
    ],
  },
  {
    name: 'Санкт-Петербург',
    region: 'Россия',
    coordinates: [59.93863, 30.31413] as [number, number],
    population: '5.6 млн человек',
    description:
      'Культурная столица с богатой историей, знаменита архитектурой, мостами и набережными Невы.',
    boundary: [
      [59.74, 29.69],
      [59.74, 30.82],
      [60.17, 30.82],
      [60.17, 29.69],
    ],
  },
  {
    name: 'Новосибирск',
    region: 'Россия',
    coordinates: [55.008353, 82.935733] as [number, number],
    population: '1.6 млн человек',
    description:
      'Крупнейший город Сибири и важный научно-образовательный центр с развитой инфраструктурой.',
    boundary: [
      [54.85, 82.7],
      [54.85, 83.1],
      [55.15, 83.1],
      [55.15, 82.7],
    ],
  },
  {
    name: 'Екатеринбург',
    region: 'Россия',
    coordinates: [56.838011, 60.597465] as [number, number],
    population: '1.5 млн человек',
    description:
      'Столица Урала, крупный промышленный и культурный центр, соединяющий Европу и Азию.',
    boundary: [
      [56.7, 60.36],
      [56.7, 60.84],
      [57.0, 60.84],
      [57.0, 60.36],
    ],
  },
  {
    name: 'Казань',
    region: 'Россия',
    coordinates: [55.796127, 49.106414] as [number, number],
    population: '1.3 млн человек',
    description:
      'Столица Татарстана, известная смешением культур, развитием IT и историческим Кремлем.',
    boundary: [
      [55.6, 48.85],
      [55.6, 49.35],
      [55.95, 49.35],
      [55.95, 48.85],
    ],
  },
] as const;

type City = (typeof cityData)[number];

const buildYandexImageUrl = (city: City) => {
  const polygon = city.boundary
    .map((point) => `${point[1].toFixed(3)},${point[0].toFixed(3)}`)
    .join('~');

  return `https://static-maps.yandex.ru/1.x/?lang=ru_RU&size=450,250&l=map&pl=c:ff3b30aa,5,1~${polygon}`;
};

export const CityInteractiveMap = () => {
  useEffect(() => {
    import('leaflet').then((L) => {
      const { Icon } = L;
      Icon.Default.mergeOptions({
        iconRetinaUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    });
  }, []);

  const center = useMemo(() => ({
    lat:
      cityData.reduce((sum, city) => sum + city.coordinates[0], 0) /
      cityData.length,
    lng:
      cityData.reduce((sum, city) => sum + city.coordinates[1], 0) /
      cityData.length,
  }), []);

  return (
    <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div>
        <h2 className="mb-3 text-2xl font-semibold text-slate-900">Интерактивная карта городов</h2>
        <p className="mb-5 text-sm text-slate-600">
          Карта основана на популярных открытых тайлах OpenStreetMap, отображаемых через библиотеку Leaflet.
          Для каждого города нанесены ориентировочные границы, а маркеры показывают население и краткое описание.
        </p>
        <div className="h-[420px] overflow-hidden rounded-2xl shadow-lg">
          <MapContainer
            center={[center.lat, center.lng]}
            zoom={4}
            scrollWheelZoom
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {cityData.map((city) => (
              <Fragment key={city.name}>
                <Polygon
                  positions={city.boundary as unknown as [number, number][]}
                  pathOptions={{ color: '#ff3b30', fillOpacity: 0.15 }}
                />
                <Marker position={city.coordinates}>
                  <Popup>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">{city.name}</span>
                      <span className="text-xs text-slate-500">{city.population}</span>
                      <p className="text-xs text-slate-600">{city.description}</p>
                    </div>
                  </Popup>
                </Marker>
              </Fragment>
            ))}
          </MapContainer>
        </div>
      </div>

      <aside>
        <h3 className="mb-3 text-lg font-semibold text-slate-900">Мини-карты контуров</h3>
        <p className="mb-4 text-xs text-slate-500">
          Изображения получены через статические карты Яндекса с выделением контуров тех же полигонов.
        </p>
        <div className="flex flex-col gap-4">
          {cityData.map((city) => (
            <article
              key={city.name}
              className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-3 overflow-hidden rounded-xl">
                <Image
                  src={buildYandexImageUrl(city)}
                  alt={`Контур города ${city.name}`}
                  width={450}
                  height={250}
                  className="h-32 w-full object-cover"
                />
              </div>
              <h4 className="text-base font-semibold text-slate-900">{city.name}</h4>
              <p className="text-xs text-slate-500">{city.region}</p>
            </article>
          ))}
        </div>
      </aside>
    </section>
  );
};

