import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');
  const yandexApiKey = process.env.NEXT_PUBLIC_YANDEX_API_KEY;

  if (!city) {
    return NextResponse.json({ error: 'City is required' }, { status: 400 });
  }

  if (!yandexApiKey) {
    console.error('Yandex API key is not defined');
    return NextResponse.json({ error: 'Internal server error: API key not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(
      `https://geocode-maps.yandex.ru/1.x/?apikey=${yandexApiKey}&format=json&geocode=${encodeURIComponent(city)}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Yandex API request failed with status ${response.status}: ${errorText}`);
      return NextResponse.json({ error: `Failed to fetch data from Yandex API: ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from Yandex Geocoding API:', error);
    return NextResponse.json({ error: 'Error fetching from Yandex Geocoding API' }, { status: 500 });
  }
}
