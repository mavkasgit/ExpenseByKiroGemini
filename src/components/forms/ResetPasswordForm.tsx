'use client'

import { useState, useEffect } from 'react'
import { updatePassword } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/client'
import type { UpdatePasswordData } from '@/lib/validations/auth'
import Link from 'next/link'

interface ResetPasswordFormProps {
  tokenHash?: string
  token?: string
  email?: string
  code?: string
  type?: string
}

export function ResetPasswordForm({ tokenHash, token, email, code, type }: ResetPasswordFormProps) {
  const [formData, setFormData] = useState<UpdatePasswordData>({
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)

  // Верифицируем токен при загрузке компонента
  useEffect(() => {
    const verifyToken = async () => {
      if (!tokenHash && !token && !code) {
        setError('Отсутствуют параметры для сброса пароля')
        setIsVerifying(false)
        return
      }

      const supabase = createClient()

      try {
        let verifyResult

        if (code) {
          // Новый формат с code параметром
          console.log('Verifying with code:', code)
          verifyResult = await supabase.auth.exchangeCodeForSession(code)
        } else if (tokenHash) {
          // Формат с token_hash
          console.log('Verifying with token_hash')
          verifyResult = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          })
        } else if (token && email) {
          // Старый формат с token
          console.log('Verifying with token and email')
          verifyResult = await supabase.auth.verifyOtp({
            token,
            type: 'recovery',
            email,
          })
        }

        if (verifyResult?.error) {
          console.error('Token verification error:', verifyResult.error)
          setError('Недействительная или устаревшая ссылка для сброса пароля')
          setTokenValid(false)
        } else if (verifyResult?.data?.user) {
          console.log('Token verified successfully, user:', verifyResult.data.user.email)
          setTokenValid(true)
        } else {
          setError('Не удалось верифицировать токен')
          setTokenValid(false)
        }
      } catch (error) {
        console.error('Token verification exception:', error)
        setError('Ошибка при проверке токена')
        setTokenValid(false)
      } finally {
        setIsVerifying(false)
      }
    }

    verifyToken()
  }, [tokenHash, token, email, code])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      const result = await updatePassword(formData)
      
      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        setSuccess('Пароль успешно обновлен! Перенаправляем на страницу входа...')
        setFormData({ password: '', confirmPassword: '' })
        // Редирект через 2 секунды
        setTimeout(() => {
          window.location.href = '/login?message=password-updated'
        }, 2000)
      }
    } catch (err) {
      setError('Произошла ошибка при обновлении пароля')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  // Показываем загрузку во время верификации токена
  if (isVerifying) {
    return (
      <div className="mt-8 space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mr-3"></div>
            <p className="text-center text-blue-600">
              Проверка ссылки для сброса пароля...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Показываем ошибку, если токен недействителен
  if (!tokenValid) {
    return (
      <div className="mt-8 space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <p className="text-center text-red-600 mb-4">
            {error || 'Недействительная или устаревшая ссылка для сброса пароля'}
          </p>
          <div className="text-center">
            <Link
              href="/forgot-password"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Запросить сброс пароля →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Новый пароль
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Введите новый пароль (минимум 6 символов)"
            value={formData.password}
            onChange={handleChange}
          />
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Подтвердите пароль
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Подтвердите новый пароль"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="text-sm text-green-700">{success}</div>
          <div className="mt-2 flex justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
          </div>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Обновление...' : 'Обновить пароль'}
        </button>
      </div>
    </form>
  )
}