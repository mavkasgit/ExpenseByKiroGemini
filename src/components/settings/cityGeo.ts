import type { LngLat } from 'yandex-maps'

export interface CityGeoEntry {
  canonicalName: string
  aliases: string[]
  center: [number, number]
  zoom: number
  polygon?: [number, number][]
}

export const normaliseCityName = (value: string) => value.trim().toLowerCase()

const cityGeoEntries: CityGeoEntry[] = [
  {
    canonicalName: 'Москва',
    aliases: ['Москва', 'Moscow', 'Msk', 'Москва г.'],
    center: [55.7558, 37.6173],
    zoom: 9,
    polygon: [
      [55.917, 37.319],
      [55.917, 37.945],
      [55.54, 37.945],
      [55.54, 37.319],
      [55.917, 37.319]
    ]
  },
  {
    canonicalName: 'Санкт-Петербург',
    aliases: ['Санкт-Петербург', 'Saint Petersburg', 'Санкт Петербург', 'St Petersburg', 'СПб'],
    center: [59.9343, 30.3351],
    zoom: 9,
    polygon: [
      [60.1, 29.6],
      [60.1, 30.9],
      [59.7, 30.9],
      [59.7, 29.6],
      [60.1, 29.6]
    ]
  },
  {
    canonicalName: 'Новосибирск',
    aliases: ['Новосибирск', 'Novosibirsk'],
    center: [55.0302, 82.9204],
    zoom: 10,
    polygon: [
      [55.18, 82.73],
      [55.18, 83.1],
      [54.9, 83.1],
      [54.9, 82.73],
      [55.18, 82.73]
    ]
  },
  {
    canonicalName: 'Екатеринбург',
    aliases: ['Екатеринбург', 'Ekaterinburg', 'Yekaterinburg'],
    center: [56.8389, 60.5975],
    zoom: 10,
    polygon: [
      [56.95, 60.35],
      [56.95, 60.85],
      [56.7, 60.85],
      [56.7, 60.35],
      [56.95, 60.35]
    ]
  },
  {
    canonicalName: 'Казань',
    aliases: ['Казань', 'Kazan'],
    center: [55.7963, 49.1064],
    zoom: 10,
    polygon: [
      [55.93, 48.85],
      [55.93, 49.35],
      [55.65, 49.35],
      [55.65, 48.85],
      [55.93, 48.85]
    ]
  },
  {
    canonicalName: 'Нижний Новгород',
    aliases: ['Нижний Новгород', 'Nizhny Novgorod'],
    center: [56.3269, 44.002],
    zoom: 10,
    polygon: [
      [56.45, 43.7],
      [56.45, 44.25],
      [56.15, 44.25],
      [56.15, 43.7],
      [56.45, 43.7]
    ]
  },
  {
    canonicalName: 'Челябинск',
    aliases: ['Челябинск', 'Chelyabinsk'],
    center: [55.1604, 61.4026],
    zoom: 10,
    polygon: [
      [55.3, 61.1],
      [55.3, 61.7],
      [54.98, 61.7],
      [54.98, 61.1],
      [55.3, 61.1]
    ]
  },
  {
    canonicalName: 'Самара',
    aliases: ['Самара', 'Samara'],
    center: [53.1959, 50.1008],
    zoom: 10,
    polygon: [
      [53.35, 49.85],
      [53.35, 50.35],
      [53.05, 50.35],
      [53.05, 49.85],
      [53.35, 49.85]
    ]
  },
  {
    canonicalName: 'Омск',
    aliases: ['Омск', 'Omsk'],
    center: [54.9893, 73.3682],
    zoom: 10,
    polygon: [
      [55.1, 73.05],
      [55.1, 73.65],
      [54.82, 73.65],
      [54.82, 73.05],
      [55.1, 73.05]
    ]
  },
  {
    canonicalName: 'Ростов-на-Дону',
    aliases: ['Ростов-на-Дону', 'Rostov-on-Don', 'Rostov na Donu'],
    center: [47.2357, 39.7203],
    zoom: 10,
    polygon: [
      [47.35, 39.45],
      [47.35, 39.95],
      [47.05, 39.95],
      [47.05, 39.45],
      [47.35, 39.45]
    ]
  },
  {
    canonicalName: 'Уфа',
    aliases: ['Уфа', 'Ufa'],
    center: [54.7388, 55.9678],
    zoom: 10,
    polygon: [
      [54.88, 55.7],
      [54.88, 56.2],
      [54.55, 56.2],
      [54.55, 55.7],
      [54.88, 55.7]
    ]
  },
  {
    canonicalName: 'Красноярск',
    aliases: ['Красноярск', 'Krasnoyarsk'],
    center: [56.0106, 92.8526],
    zoom: 10,
    polygon: [
      [56.15, 92.55],
      [56.15, 93.2],
      [55.88, 93.2],
      [55.88, 92.55],
      [56.15, 92.55]
    ]
  },
  {
    canonicalName: 'Пермь',
    aliases: ['Пермь', 'Perm'],
    center: [58.0104, 56.2294],
    zoom: 10
  },
  {
    canonicalName: 'Воронеж',
    aliases: ['Воронеж', 'Voronezh'],
    center: [51.6608, 39.2003],
    zoom: 10
  },
  {
    canonicalName: 'Волгоград',
    aliases: ['Волгоград', 'Volgograd'],
    center: [48.708, 44.5018],
    zoom: 10
  },
  {
    canonicalName: 'Саратов',
    aliases: ['Саратов', 'Saratov'],
    center: [51.5336, 46.0333],
    zoom: 10
  },
  {
    canonicalName: 'Краснодар',
    aliases: ['Краснодар', 'Krasnodar'],
    center: [45.0355, 38.9747],
    zoom: 10
  },
  {
    canonicalName: 'Тюмень',
    aliases: ['Тюмень', 'Tyumen'],
    center: [57.153, 65.5343],
    zoom: 10
  },
  {
    canonicalName: 'Томск',
    aliases: ['Томск', 'Tomsk'],
    center: [56.4847, 84.9744],
    zoom: 10
  },
  {
    canonicalName: 'Иркутск',
    aliases: ['Иркутск', 'Irkutsk'],
    center: [52.2869, 104.296],
    zoom: 10
  },
  {
    canonicalName: 'Якутск',
    aliases: ['Якутск', 'Yakutsk'],
    center: [62.0355, 129.7326],
    zoom: 10
  },
  {
    canonicalName: 'Владивосток',
    aliases: ['Владивосток', 'Vladivostok'],
    center: [43.1155, 131.8869],
    zoom: 10
  },
  {
    canonicalName: 'Хабаровск',
    aliases: ['Хабаровск', 'Khabarovsk'],
    center: [48.4827, 135.0719],
    zoom: 10
  },
  {
    canonicalName: 'Калининград',
    aliases: ['Калининград', 'Kaliningrad'],
    center: [54.7104, 20.492],
    zoom: 11,
    polygon: [
      [54.82, 20.34],
      [54.82, 20.66],
      [54.59, 20.66],
      [54.59, 20.34],
      [54.82, 20.34]
    ]
  },
  {
    canonicalName: 'Барнаул',
    aliases: ['Барнаул', 'Barnaul'],
    center: [53.3481, 83.7689],
    zoom: 11
  },
  {
    canonicalName: 'Сочи',
    aliases: ['Сочи', 'Sochi'],
    center: [43.5855, 39.7303],
    zoom: 11,
    polygon: [
      [43.75, 39.4],
      [43.75, 39.9],
      [43.45, 39.9],
      [43.45, 39.4],
      [43.75, 39.4]
    ]
  },
  {
    canonicalName: 'Ярославль',
    aliases: ['Ярославль', 'Yaroslavl'],
    center: [57.6266, 39.8938],
    zoom: 11
  },
  {
    canonicalName: 'Белгород',
    aliases: ['Белгород', 'Belgorod'],
    center: [50.5997, 36.5802],
    zoom: 11
  },
  {
    canonicalName: 'Тула',
    aliases: ['Тула', 'Tula'],
    center: [54.1961, 37.6188],
    zoom: 11
  }
]

const aliasLookup = new Map<string, CityGeoEntry>()

cityGeoEntries.forEach(entry => {
  entry.aliases.forEach(alias => {
    aliasLookup.set(normaliseCityName(alias), entry)
  })
})

export const getCityGeoEntry = (name: string): CityGeoEntry | undefined => {
  return aliasLookup.get(normaliseCityName(name))
}

export const getCityCenter = (name: string): [number, number] | undefined => {
  return getCityGeoEntry(name)?.center
}

export const getCityPolygon = (name: string): [number, number][] | undefined => {
  return getCityGeoEntry(name)?.polygon
}

export const getCityZoom = (name: string): number | undefined => {
  return getCityGeoEntry(name)?.zoom
}

export const getAllKnownCityNames = () => cityGeoEntries.map(entry => entry.canonicalName)

export type CityLngLat = LngLat
