'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import type { ResetPasswordData } from '@/lib/validations/auth'

export function ForgotPasswordForm() {
  const [formData, setFormData] = useState<ResetPasswordData>({
    email: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (supabaseError) {
        setError(supabaseError.message)
      } else {
        setSuccess('Ссылка для сброса пароля отправлена на ваш email!')
        setFormData({ email: '' })
      }
    } catch (err: any) {
      setError('Произошла ошибка при отправке запроса')
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

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email адрес</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${error ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="Введите ваш email адрес"
          value={formData.email}
          onChange={handleChange}
        />
      </div>

      {error && (
        <ErrorMessage 
          error={error} 
          onDismiss={() => setError(null)}
          showDismiss={true}
        />
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="text-sm text-green-700">{success}</div>
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
              <span>Отправка...</span>
            </div>
          ) : (
            <span>Отправить ссылку для сброса</span>
          )}
        </button>
      </div>
    </form>
  )
}