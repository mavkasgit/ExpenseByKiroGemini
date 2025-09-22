"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import clsx from "clsx";

import { City, cities } from "@/data/cities";

const buildMapSrc = (city: City, allCities: City[]) => {
  const points = allCities
    .map((item) => {
      const icon = item.id === city.id ? "pm2rdm" : "pm2blm";
      return `${item.coordinates.lon.toFixed(6)},${item.coordinates.lat.toFixed(6)},${icon}`;
    })
    .join("~");

  return `https://yandex.com/map-widget/v1/?lang=ru_RU&ll=${city.coordinates.lon.toFixed(
    6
  )},${city.coordinates.lat.toFixed(6)}&z=${city.zoom}&l=map&pt=${points}`;
};

export const CityExplorer = () => {
  const [selectedCity, setSelectedCity] = useState<City>(cities[0]);

  const mapSrc = useMemo(() => buildMapSrc(selectedCity, cities), [selectedCity]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-2xl shadow-slate-900/60 backdrop-blur">
        <header className="flex flex-col gap-1">
          <p className="text-sm font-medium text-slate-400">Яндекс Карты · интерактивная панель</p>
          <h2 className="text-2xl font-semibold text-slate-50">Города России на одной карте</h2>
          <p className="text-sm text-slate-400">
            Кликайте по точкам на карте или выбирайте город в списке, чтобы увидеть краткую справку и очертания границ.
          </p>
        </header>

        <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
          <iframe
            key={selectedCity.id}
            src={mapSrc}
            title={`Интерактивная карта с выделением города ${selectedCity.name}`}
            className="h-full w-full"
            loading="lazy"
            allowFullScreen
          />
          <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-slate-700/40" />
        </div>
      </section>

      <aside className="space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-2xl shadow-slate-900/60 backdrop-blur">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-400">Список городов</p>
          <div className="flex flex-wrap gap-2">
            {cities.map((city) => (
              <button
                key={city.id}
                type="button"
                onClick={() => setSelectedCity(city)}
                className={clsx(
                  "rounded-full border px-4 py-2 text-sm font-semibold transition",
                  city.id === selectedCity.id
                    ? "border-transparent bg-slate-50 text-slate-900 shadow-lg"
                    : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:text-slate-100"
                )}
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>

        <article className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-slate-900/60 backdrop-blur">
          <header className="space-y-2">
            <span
              className="inline-flex items-center rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300"
            >
              {selectedCity.region}
            </span>
            <h3 className="text-3xl font-semibold text-slate-50">{selectedCity.name}</h3>
            <p className="text-sm text-slate-400">{selectedCity.description}</p>
          </header>

          <div className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Основан</span>
              <span className="font-semibold text-slate-100">{selectedCity.founded}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Население</span>
              <span className="font-semibold text-slate-100">{selectedCity.population}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Площадь</span>
              <span className="font-semibold text-slate-100">{selectedCity.area}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Основные отрасли</h4>
            <ul className="grid gap-2 text-sm text-slate-200">
              {selectedCity.industries.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 flex-none rounded-full" style={{ backgroundColor: selectedCity.accentColor }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Что выделяет город</h4>
            <ul className="grid gap-2 text-sm text-slate-200">
              {selectedCity.highlights.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 flex-none rounded-full bg-slate-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <figure className="space-y-3">
            <figcaption className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Очертания города по данным Яндекс Карт
            </figcaption>
            <div className="overflow-hidden rounded-xl border border-slate-800">
              <Image
                src={selectedCity.outlineUrl}
                alt={`Схема границ города ${selectedCity.name}`}
                width={450}
                height={300}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="text-xs text-slate-500">
              Контур отображается с использованием статического API Яндекс Карт и соответствует приблизительным границам городской агломерации.
            </p>
          </figure>
        </article>
      </aside>
    </div>
  );
};
