import { z } from 'zod'

export const keywordSchema = z.object({
  keyword: z.string()
    .min(1, 'Ключевое слово обязательно')
    .max(100, 'Ключевое слово не должно превышать 100 символов')
    .trim()
    .toLowerCase(),
  cyrillic_keyword: z.string()
    .max(100, 'Кириллическое слово не должно превышать 100 символов')
    .trim()
    .toLowerCase()
    .nullable()
    .optional(),
  category_id: z.string()
    .uuid('Неверный формат ID категории')
})

export const updateKeywordSchema = z.object({
  keyword: z.string()
    .min(1, 'Ключевое слово обязательно')
    .max(100, 'Ключевое слово не должно превышать 100 символов')
    .trim()
    .toLowerCase()
    .optional(),
  cyrillic_keyword: z.string()
    .max(100, 'Кириллическое слово не должно превышать 100 символов')
    .trim()
    .toLowerCase()
    .nullable()
    .optional(),
  category_id: z.string()
    .uuid('Неверный формат ID категории')
    .optional()
})

export const assignKeywordToCategorySchema = z.object({
  keyword: z.string()
    .min(1, 'Ключевое слово обязательно')
    .max(100, 'Ключевое слово не должно превышать 100 символов')
    .trim()
    .toLowerCase(),
  category_id: z.string()
    .uuid('Неверный формат ID категории')
})

export type CreateKeywordData = z.infer<typeof keywordSchema>
export type UpdateKeywordData = z.infer<typeof updateKeywordSchema>
export type AssignKeywordData = z.infer<typeof assignKeywordToCategorySchema>