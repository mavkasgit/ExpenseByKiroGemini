import { z } from 'zod'

export const expenseSchema = z.object({
  amount: z.number()
    .positive('Сумма должна быть больше 0')
    .max(999999.99, 'Сумма не должна превышать 999,999.99'),
  description: z.string()
    .min(1, 'Описание обязательно для определения категории')
    .max(500, 'Описание не должно превышать 500 символов'),
  notes: z.string()
    .max(1000, 'Примечание не должно превышать 1000 символов')
    .optional(),
  category_id: z.string()
    .uuid('Неверный формат ID категории')
    .optional(), // Делаем необязательным - система сама определит
  expense_date: z.string()
    .refine((date) => {
      const parsed = new Date(date)
      return !isNaN(parsed.getTime())
    }, 'Неверный формат даты')
    .refine((date) => {
      const parsed = new Date(date)
      const now = new Date()
      const maxDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
      return parsed <= maxDate
    }, 'Дата не может быть в будущем более чем на год'),
  expense_time: z.string()
    .regex(/^\d{2}:\d{2}$/, 'Время должно быть в формате ЧЧ:ММ')
    .refine((time) => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
    }, 'Неверное время')
    .nullable()
    .optional(),
  input_method: z.enum(['single', 'bulk_table'])
    .default('single'),
  batch_id: z.string()
    .uuid()
    .optional()
})

export const updateExpenseSchema = z.object({
  amount: z.number()
    .positive('Сумма должна быть больше 0')
    .max(999999.99, 'Сумма не должна превышать 999,999.99')
    .optional(),
  description: z.string()
    .max(500, 'Описание не должно превышать 500 символов')
    .optional(),
  notes: z.string()
    .max(1000, 'Примечание не должно превышать 1000 символов')
    .optional(),
  category_id: z.string()
    .uuid('Неверный формат ID категории')
    .nullable()
    .optional(),
  expense_date: z.string()
    .refine((date) => {
      const parsed = new Date(date)
      return !isNaN(parsed.getTime())
    }, 'Неверный формат даты')
    .refine((date) => {
      const parsed = new Date(date)
      const now = new Date()
      const maxDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
      return parsed <= maxDate
    }, 'Дата не может быть в будущем более чем на год')
    .optional(),
  expense_time: z.string()
    .regex(/^\d{2}:\d{2}$/, 'Время должно быть в формате ЧЧ:ММ')
    .refine((time) => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
    }, 'Неверное время')
    .nullable()
    .optional()
})

export const bulkExpenseRowSchema = z.object({
  amount: z.number()
    .positive('Сумма должна быть больше 0')
    .max(999999.99, 'Сумма не должна превышать 999,999.99'),
  description: z.string()
    .min(1, 'Описание обязательно')
    .max(500, 'Описание не должно превышать 500 символов'),
  notes: z.string()
    .max(1000, 'Примечание не должно превышать 1000 символов')
    .optional(),
  category_id: z.string()
    .uuid('Неверный формат ID категории')
    .optional(),
  expense_date: z.string()
    .refine((date) => {
      const parsed = new Date(date)
      return !isNaN(parsed.getTime())
    }, 'Неверный формат даты')
    .refine((date) => {
      const parsed = new Date(date)
      const now = new Date()
      const maxDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
      return parsed <= maxDate
    }, 'Дата не может быть в будущем более чем на год'),
  expense_time: z.string()
    .regex(/^\d{2}:\d{2}$/, 'Время должно быть в формате ЧЧ:ММ')
    .refine((time) => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
    }, 'Неверное время')
    .nullable()
    .optional(),
  city: z.string()
    .max(100, 'Название города не должно превышать 100 символов')
    .nullable()
    .optional(),
  tempId: z.string().optional() // для отслеживания в UI
})

export const bulkExpenseSchema = z.array(bulkExpenseRowSchema)

export type CreateExpenseData = z.infer<typeof expenseSchema>
export type UpdateExpenseData = z.infer<typeof updateExpenseSchema>
export type BulkExpenseData = z.infer<typeof bulkExpenseSchema>
export type BulkExpenseRowData = z.infer<typeof bulkExpenseRowSchema>