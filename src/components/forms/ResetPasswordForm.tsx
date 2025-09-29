'use client'

import { useState, useEffect } from 'react'
import { updatePassword } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/client'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import type { UpdatePasswordData } from '@/lib/validations/auth'
import Link from 'next/link'

export function ResetPasswordForm() {
  const [formData, setFormData] = useState<UpdatePasswordData>({
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)

  useEffect(() => {
    const verifyToken = async () => {
      const supabase = createClient()
      const { data: { session }, error: getSessionError } = await supabase.auth.getSession()

      if (getSessionError) {
        setError('Недействительная или устаревшая ссылка для сброса пароля.')
        setTokenValid(false)
      } else if (session) {
        setTokenValid(true)
      } else {
        setError('Отсутствует токен для сброса пароля.')
        setTokenValid(false)
      }
      setIsVerifying(false)
    }

    verifyToken()
  }, [])

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
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  if (isVerifying) {
    return (
      <div className="mt-8 space-y-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="ml-3 text-gray-600">Проверка ссылки...</p>
        </div>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="mt-8 space-y-6">
        <ErrorMessage error={error || 'Ссылка недействительна.'} showDismiss={false} />
        <div className="text-center">
          <Link href="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">Запросить новую ссылку</Link>
        </div>
      </div>
    )
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Новый пароль</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${error ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Введите новый пароль (минимум 6 символов)"
            value={formData.password}
            onChange={handleChange}
          />
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Подтвердите пароль</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${error ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Подтвердите новый пароль"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
        </div>
      </div>

      {error && <ErrorMessage error={error} onDismiss={() => setError(null)} showDismiss={true} />}

      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
            <div className="text-sm text-green-700">{success}</div>
          </div>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              <span>Обновление...</span>
            </div>
          ) : (
            <span>Обновить пароль</span>
          )}
        </button>
      </div>
    </form>
  )
}