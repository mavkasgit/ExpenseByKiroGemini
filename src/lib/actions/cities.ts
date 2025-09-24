'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import {
  updateCityCoordinatesSchema,
  updateCityFavoriteSchema,
  type UpdateCityCoordinatesData,
  type UpdateCityFavoriteData
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

export async function toggleCityFavorite(data: UpdateCityFavoriteData) {
  const supabase = await createServerClient();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: 'Пользователь не авторизован' };
    }

    const validated = updateCityFavoriteSchema.parse(data);

    const { error } = await supabase
      .from('cities')
      .update({
        is_favorite: validated.isFavorite,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Ошибка обновления статуса избранного города:', error);
      return { error: 'Не удалось обновить статус избранного города' };
    }

    return { success: true };
  } catch (err) {
    console.error('Ошибка обновления статуса избранного города:', err);
    return { error: 'Произошла ошибка при обновлении статуса избранного города' };
  }
}
