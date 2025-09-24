'use client'

import { useState } from 'react'
import { signIn } from '@/lib/actions/auth'
import { GoogleSignInButton } from './GoogleSignInButton'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import type { SignInData } from '@/lib/validations/auth'

export function LoginForm() {
  const [formData, setFormData] = useState<SignInData>({
    email: '',
    password: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    setIsSuccess(false)

    try {
      const result = await signIn(formData)
      if (result?.error) {
        setError(result.error)
        setIsLoading(false)
      } else if (result?.success) {
        // Успешный вход - показываем состояние успеха и делаем redirect
        setIsSuccess(true)
        // Небольшая задержка для показа сообщения об успехе
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1000)
      }
    } catch (err) {
      console.error('Login form error:', err)
      setError('Произошла ошибка при входе')
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Google Sign In Button */}
      <GoogleSignInButton />
      
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-gray-50 text-gray-500">или</span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="rounded-md shadow-sm -space-y-px">
          <div>
            <label htmlFor="email" className="sr-only">
              Email адрес
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="new-password"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Email адрес"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Пароль
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Пароль"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
        </div>

        {error && !isSuccess && (
          <ErrorMessage 
            error={error} 
            onDismiss={() => setError(null)}
            showDismiss={true}
          />
        )}

        {isSuccess && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
              <div className="text-sm text-green-700">Вход выполнен! Перенаправляем...</div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <a
              href="/forgot-password"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Забыли пароль?
            </a>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (isSuccess ? 'Перенаправление...' : 'Вход...') : 'Войти'}
          </button>
        </div>
      </form>
    </div>
  )
}