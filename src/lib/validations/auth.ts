import { z } from 'zod'

export const signUpSchema = z.object({
  email: z.string().email('Введите корректный email адрес'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
})

export const signInSchema = z.object({
  email: z.string().email('Введите корректный email адрес'),
  password: z.string().min(1, 'Введите пароль'),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Введите корректный email адрес'),
})

export const updatePasswordSchema = z.object({
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
  confirmPassword: z.string(),
  tokenHash: z.string().optional(),
  token: z.string().optional(),
  email: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
})

export type SignUpData = z.infer<typeof signUpSchema>
export type SignInData = z.infer<typeof signInSchema>
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>
export type UpdatePasswordData = z.infer<typeof updatePasswordSchema>