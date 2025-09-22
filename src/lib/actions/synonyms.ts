'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import {
  keywordSynonymSchema,
  deleteKeywordSynonymSchema,
  citySynonymSchema,
  deleteCitySynonymSchema,
  deleteCitySchema,
  updateCitySchema,
  type CreateKeywordSynonymData,
  type DeleteKeywordSynonymData,
  type CreateCitySynonymData,
  type DeleteCitySynonymData,
  type DeleteCityData,
  type UpdateCityData
} from '@/lib/validations/synonyms';
import type { KeywordSynonym, CitySynonym, City } from '@/types';

type Coordinates = { lat: number; lon: number };

type CitySynonymWithCity = CitySynonym & { city: Pick<City, 'id' | 'name' | 'coordinates'> | null };

const geocoderApiKey =
  process.env.YANDEX_GEOCODER_API_KEY ?? process.env.NEXT_PUBLIC_YANDEX_GEOCODER_API_KEY ?? null;

async function geocodeCityCoordinates(cityName: string): Promise<Coordinates | null> {
  if (!geocoderApiKey) {
    return null;
  }

  const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${geocoderApiKey}&format=json&geocode=${encodeURIComponent(cityName)}`;

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      console.error('Не удалось получить координаты города. Код ответа:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    const featureMember = data?.response?.GeoObjectCollection?.featureMember ?? [];

    if (featureMember.length === 0) {
      return null;
    }

    const point = featureMember[0]?.GeoObject?.Point?.pos as string | undefined;
    if (!point) {
      return null;
    }

    const [lonString, latString] = point.split(' ');
    const lon = Number.parseFloat(lonString);
    const lat = Number.parseFloat(latString);

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return null;
    }

    return { lat, lon } satisfies Coordinates;
  } catch (error) {
    console.error('Ошибка при геокодировании города', cityName, error);
    return null;
  }
}

export async function createKeywordSynonym(data: CreateKeywordSynonymData) {
  const supabase = await createServerClient();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' };
    }

    const validated = keywordSynonymSchema.parse(data);

    const { data: synonym, error } = await supabase
      .from('keyword_synonyms')
      .insert({
        keyword_id: validated.keyword_id,
        synonym: validated.synonym.trim(),
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { error: 'Такой синоним уже существует' };
      }
      console.error('Ошибка создания синонима ключевого слова:', error);
      return { error: 'Не удалось создать синоним' };
    }

    revalidatePath('/categories');
    return { success: true, data: synonym as KeywordSynonym };
  } catch (err) {
    console.error('Ошибка добавления синонима ключевого слова:', err);
    return { error: 'Произошла ошибка при создании синонима' };
  }
}

export async function deleteKeywordSynonym(data: DeleteKeywordSynonymData) {
  const supabase = await createServerClient();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' };
    }

    const validated = deleteKeywordSynonymSchema.parse(data);

    const { error } = await supabase
      .from('keyword_synonyms')
      .delete()
      .eq('id', validated.id as any)
      .eq('user_id', user.id);

    if (error) {
      console.error('Ошибка удаления синонима ключевого слова:', error);
      return { error: 'Не удалось удалить синоним' };
    }

    revalidatePath('/categories');
    return { success: true };
  } catch (err) {
    console.error('Ошибка удаления синонима ключевого слова:', err);
    return { error: 'Произошла ошибка при удалении синонима' };
  }
}

export async function getCitySynonyms() {
  const supabase = await createServerClient();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' };
    }

    const { data, error } = await supabase
      .from('city_synonyms')
      .select('id, synonym, city_id, user_id, created_at, city:cities(id, name, coordinates)')
      .eq('user_id', user.id);

    if (error) {
      console.error('Ошибка загрузки синонимов городов:', error);
      return { error: 'Не удалось загрузить синонимы городов' };
    }

    const records = (data || []) as CitySynonymWithCity[];
    const sorted = records.sort((a, b) => {
      const nameA = a.city?.name?.toLocaleLowerCase('ru') ?? '';
      const nameB = b.city?.name?.toLocaleLowerCase('ru') ?? '';
      if (nameA !== nameB) {
        return nameA.localeCompare(nameB, 'ru');
      }
      return a.synonym.localeCompare(b.synonym, 'ru');
    });

    return { success: true, data: sorted };
  } catch (err) {
    console.error('Ошибка получения синонимов городов:', err);
    return { error: 'Произошла ошибка при загрузке синонимов городов' };
  }
}

export async function createCitySynonym(data: CreateCitySynonymData) {
  const supabase = await createServerClient();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' };
    }

    const validated = citySynonymSchema.parse(data);
    const trimmedSynonym = validated.synonym.trim();

    let cityRecord: Pick<City, 'id' | 'name' | 'coordinates'> | null = null;
    let cityId = validated.cityId ?? null;

    if (cityId) {
      const { data: existingCity, error: cityError } = await supabase
        .from('cities')
        .select('id, name, coordinates')
        .eq('id', cityId)
        .eq('user_id', user.id)
        .single();

      if (cityError || !existingCity) {
        return { error: 'Город не найден' };
      }

      cityRecord = existingCity as Pick<City, 'id' | 'name' | 'coordinates'>;
      cityId = cityRecord.id;
    } else {
      const cityName = validated.city?.trim();
      if (!cityName) {
        return { error: 'Укажите название города' };
      }

      const { data: existingCity } = await supabase
        .from('cities')
        .select('id')
        .eq('user_id', user.id)
        .ilike('name', cityName)
        .maybeSingle();

      if (existingCity) {
        return { error: 'Город с таким названием уже существует' };
      }

      const timestamp = new Date().toISOString();

      const { data: newCity, error: createCityError } = await supabase
        .from('cities')
        .insert({
          name: cityName,
          user_id: user.id,
          updated_at: timestamp
        })
        .select('id, name, coordinates')
        .single();

      if (createCityError || !newCity) {
        console.error('Ошибка создания города:', createCityError);
        return { error: 'Не удалось создать город' };
      }

      cityRecord = newCity as Pick<City, 'id' | 'name' | 'coordinates'>;
      cityId = cityRecord.id;

      const geocoded = await geocodeCityCoordinates(cityName);
      if (geocoded) {
        const { error: updateError } = await supabase
          .from('cities')
          .update({ coordinates: geocoded, updated_at: timestamp })
          .eq('id', cityId)
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Не удалось сохранить координаты нового города:', updateError);
        } else {
          cityRecord = { ...cityRecord, coordinates: geocoded };
        }
      }
    }

    if (!cityId || !cityRecord) {
      return { error: 'Не удалось определить город' };
    }

    const { data: synonym, error } = await supabase
      .from('city_synonyms')
      .insert({
        city_id: cityId,
        synonym: trimmedSynonym,
        user_id: user.id
      })
      .select('id, city_id, synonym, user_id, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return { error: 'Такой синоним города уже существует' };
      }
      console.error('Ошибка создания синонима города:', error);
      return { error: 'Не удалось создать синоним города' };
    }

    revalidatePath('/settings');
    revalidatePath('/cities');
    return { success: true, data: { ...(synonym as CitySynonym), city: cityRecord } as CitySynonymWithCity };
  } catch (err) {
    console.error('Ошибка добавления синонима города:', err);
    return { error: 'Произошла ошибка при создании синонима города' };
  }
}

export async function deleteCitySynonym(data: DeleteCitySynonymData) {
  const supabase = await createServerClient();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' };
    }

    const validated = deleteCitySynonymSchema.parse(data);
    const recordId = typeof validated.id === 'string' ? Number(validated.id) : validated.id;

    if (!Number.isInteger(recordId) || recordId <= 0) {
      return { error: 'Некорректный идентификатор записи синонима' };
    }

    const { error } = await supabase
      .from('city_synonyms')
      .delete()
      .eq('id', recordId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Ошибка удаления синонима города:', error);
      return { error: 'Не удалось удалить синоним города' };
    }

    revalidatePath('/settings');
    revalidatePath('/cities');
    return { success: true };
  } catch (err) {
    console.error('Ошибка удаления синонима города:', err);
    return { error: 'Произошла ошибка при удалении синонима города' };
  }
}

export async function deleteCity(data: DeleteCityData) {
  const supabase = await createServerClient();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' };
    }

    const validated = deleteCitySchema.parse(data);

    const { data: existingCity, error: existingError } = await supabase
      .from('cities')
      .select('id')
      .eq('id', validated.id)
      .eq('user_id', user.id)
      .single();

    if (existingError || !existingCity) {
      return { error: 'Город не найден' };
    }

    const { error: deleteSynonymsError } = await supabase
      .from('city_synonyms')
      .delete()
      .eq('user_id', user.id)
      .eq('city_id', validated.id);

    if (deleteSynonymsError) {
      console.error('Ошибка удаления синонимов города:', deleteSynonymsError);
      return { error: 'Не удалось удалить синонимы города' };
    }

    const { error } = await supabase
      .from('cities')
      .delete()
      .eq('id', validated.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Ошибка удаления города:', error);
      return { error: 'Не удалось удалить город' };
    }

    revalidatePath('/settings');
    revalidatePath('/cities');
    return { success: true };
  } catch (err) {
    console.error('Ошибка при удалении города:', err);
    return { error: 'Произошла ошибка при удалении города' };
  }
}

export async function updateCityName(data: UpdateCityData) {
  const supabase = await createServerClient();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' };
    }

    const validated = updateCitySchema.parse(data);

    const { data: existingCity, error: existingError } = await supabase
      .from('cities')
      .select('id, name')
      .eq('id', validated.id)
      .eq('user_id', user.id)
      .single();

    if (existingError || !existingCity) {
      return { error: 'Город не найден' };
    }

    const newCityName = validated.newCityName.trim();

    const { data: duplicateCity } = await supabase
      .from('cities')
      .select('id')
      .eq('user_id', user.id)
      .ilike('name', newCityName)
      .neq('id', validated.id)
      .maybeSingle();

    if (duplicateCity) {
      return { error: 'Город с таким названием уже существует' };
    }

    const timestamp = new Date().toISOString();

    const { error: updateCityError } = await supabase
      .from('cities')
      .update({ name: newCityName, updated_at: timestamp })
      .eq('id', validated.id)
      .eq('user_id', user.id);

    if (updateCityError) {
      console.error('Ошибка обновления города:', updateCityError);
      return { error: 'Не удалось обновить город' };
    }

    const { error: updateCanonicalError } = await supabase
      .from('city_synonyms')
      .update({ synonym: newCityName })
      .eq('city_id', validated.id)
      .eq('user_id', user.id)
      .eq('synonym', existingCity.name);

    if (updateCanonicalError) {
      console.error('Ошибка обновления основного названия города:', updateCanonicalError);
      return { error: 'Не удалось обновить основной вариант города' };
    }

    revalidatePath('/settings');
    revalidatePath('/cities');
    return { success: true };
  } catch (err) {
    console.error('Ошибка изменения города:', err);
    return { error: 'Произошла ошибка при обновлении города' };
  }
}