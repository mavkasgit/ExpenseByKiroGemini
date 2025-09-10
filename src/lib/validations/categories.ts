import { z } from 'zod'

export const categorySchema = z.object({
  name: z.string()
    .min(1, 'Название категории обязательно')
    .max(100, 'Название не должно превышать 100 символов')
    .trim(),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Неверный формат цвета')
    .optional(),
  icon: z.string()
    .min(1, 'Иконка обязательна')
    .max(50, 'Название иконки слишком длинное')
    .optional(),
  category_group_id: z.string().uuid('Неверный ID группы').nullable().optional()
})

export const updateCategorySchema = z.object({
  name: z.string()
    .min(1, 'Название категории обязательно')
    .max(100, 'Название не должно превышать 100 символов')
    .trim()
    .optional(),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Неверный формат цвета')
    .optional(),
  icon: z.string()
    .min(1, 'Иконка обязательна')
    .max(50, 'Название иконки слишком длинное')
    .optional(),
  category_group_id: z.string().uuid('Неверный ID группы').nullable().optional()
})

export type CategoryData = z.infer<typeof categorySchema>
export type UpdateCategoryData = z.infer<typeof updateCategorySchema>