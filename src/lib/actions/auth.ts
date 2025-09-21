'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { signUpSchema, signInSchema, resetPasswordSchema, updatePasswordSchema } from '@/lib/validations/auth'
import type { SignUpData, SignInData, ResetPasswordData, UpdatePasswordData } from '@/lib/validations/auth'

function getPublicSiteUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (envUrl) {
    return envUrl
  }

  const vercelUrls = [
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_URL,
    process.env.VERCEL_DEPLOYMENT_URL,
  ]

  for (const url of vercelUrls) {
    const normalizedUrl = url?.trim()
    if (!normalizedUrl) {
      continue
    }

    if (/^https?:\/\//i.test(normalizedUrl)) {
      return normalizedUrl
    }

    return `https://${normalizedUrl}`
  }

  const origin = headers().get('origin')
  if (origin) {
    return origin
  }

  return 'http://localhost:3000'
}

export async function signUp(data: SignUpData) {
  const supabase = await createServerClient()

  try {
    // Validate the data
    const validatedData = signUpSchema.parse(data)

    const { data: authData, error } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        emailRedirectTo: `${getPublicSiteUrl()}/auth/confirm`,
      },
    })

    if (error) {
      console.error('Signup error:', error?.message)
      return { error: error.message }
    }

    // Если пользователь уже существует, но не подтвержден
    if (authData.user && !authData.user.email_confirmed_at) {
      return { 
        success: true, 
        message: 'Проверьте свою электронную почту для подтверждения регистрации' 
      }
    }

    // Если пользователь уже подтвержден
    if (authData.user && authData.user.email_confirmed_at) {
      return { 
        success: true, 
        message: 'Пользователь уже зарегистрирован и подтвержден. Можете войти в систему.' 
      }
    }

    return { 
      success: true, 
      message: 'Проверьте свою электронную почту для подтверждения регистрации' 
    }
  } catch (err: any) {
    console.error('Signup validation error:', err?.message ?? err)
    return { error: 'Ошибка валидации данных' }
  }
}

export async function signIn(data: SignInData) {
  const supabase = await createServerClient()

  try {
    // Validate the data
    const validatedData = signInSchema.parse(data)

    const { error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    })

    if (error) {
      return { error: error.message }
    }

    // Успешный вход - возвращаем успех
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    console.error('Sign in error:', err?.message ?? err)
    return { error: 'Произошла ошибка при входе' }
  }
}

export async function signOut() {
  const supabase = await createServerClient()

  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    console.error('Sign out error:', err?.message ?? err)
    return { error: 'Произошла ошибка при выходе' }
  }
}

export async function resetPassword(data: ResetPasswordData) {
  const supabase = await createServerClient()

  try {
    // Validate the data
    const validatedData = resetPasswordSchema.parse(data)

    const { error } = await supabase.auth.resetPasswordForEmail(validatedData.email, {
      redirectTo: `${getPublicSiteUrl()}/auth/reset-password`,
    })

    if (error) {
      console.error('Reset password error:', error?.message)
      return { error: error.message }
    }

    return { 
      success: true, 
      message: 'Проверьте свою электронную почту для сброса пароля' 
    }
  } catch (err: any) {
    console.error('Reset password validation error:', err?.message ?? err)
    return { error: 'Ошибка валидации данных' }
  }
}

export async function updatePassword(data: UpdatePasswordData) {
  const supabase = await createServerClient()

  try {
    // Validate the data
    const validatedData = updatePasswordSchema.parse(data)

    // Проверяем, что пользователь аутентифицирован
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('User not authenticated:', userError?.message)
      return { error: 'Пользователь не аутентифицирован. Пожалуйста, перейдите по ссылке из email еще раз.' }
    }

    // Обновляем пароль
    const { error } = await supabase.auth.updateUser({
      password: validatedData.password
    })

    if (error) {
      console.error('Update password error:', error?.message)
      return { error: error.message }
    }
    return { success: true, message: 'Пароль успешно обновлен!' }
  } catch (err: any) {
    console.error('Update password validation error:', err?.message ?? err)
    return { error: 'Ошибка валидации данных' }
  }
}

export async function signInWithGoogle() {
  const supabase = await createServerClient()

  const redirectUrl = `${getPublicSiteUrl()}/auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        prompt: 'select_account', // Заставляет Google показывать выбор аккаунта
        access_type: 'offline',
      },
    },
  })

  if (error) {
    console.error('Google sign in error:', error?.message)
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }

  return { success: true }
}

export async function signInWithGoogleForceSelect() {
  const supabase = await createServerClient()

  const redirectUrl = `${getPublicSiteUrl()}/auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        prompt: 'select_account consent', // Принудительный выбор аккаунта и согласие
        access_type: 'offline',
      },
    },
  })

  if (error) {
    console.error('Google sign in error:', error?.message)
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }

  return { success: true }
}

export async function getUser() {
  const supabase = await createServerClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    return { error: error.message }
  }

  return { user }
}