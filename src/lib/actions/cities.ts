'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import {
  updateCityCoordinatesSchema,
  toggleCityFavoriteSchema,
  type UpdateCityCoordinatesData,
  type ToggleCityFavoriteData
} from '@/lib/validations/cities';

export async function updateCityCoordinates(data: UpdateCityCoordinatesData) {
  const supabase = await createServerClient();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' };
    }

    const validated = updateCityCoordinatesSchema.parse(data);

    const { error } = await supabase
      .from('cities')
      .update({
        coordinates: validated.coordinates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Ошибка обновления координат города:', error);
      return { error: 'Не удалось обновить координаты' };
    }

    revalidatePath('/settings'); // Or the correct path
    return { success: true };
  } catch (err) {
    console.error('Ошибка обновления координат города:', err);
    return { error: 'Произошла ошибка при обновлении координат' };
  }
}

export async function toggleCityFavorite(data: ToggleCityFavoriteData) {
  const supabase = await createServerClient();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' };
    }

    const validated = toggleCityFavoriteSchema.parse(data);

    const { error } = await supabase
      .from('cities')
      .update({
        is_favorite: validated.isFavorite,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Ошибка обновления избранного города:', error);
      return { error: 'Не удалось обновить избранный город' };
    }

    revalidatePath('/settings');
    revalidatePath('/cities');

    return { success: true };
  } catch (err) {
    console.error('Ошибка при обновлении избранного города:', err);
    return { error: 'Произошла ошибка при обновлении избранного города' };
  }
}
