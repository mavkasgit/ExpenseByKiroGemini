'use client'

import { useState } from 'react'
import { signOut } from '@/lib/actions/auth'

export function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignOut = async () => {
    setError(null)
    setIsLoading(true)
    setIsSuccess(false)

    try {
      const result = await signOut()
      if (result?.error) {
        setError(result.error)
        setIsLoading(false)
      } else if (result?.success) {
        setIsSuccess(true)
        // Показываем анимацию успеха, затем перенаправляем
        setTimeout(() => {
          window.location.href = '/login'
        }, 1500)
      }
    } catch (err) {
      console.error('Sign out error:', err)
      setError('Произошла ошибка при выходе')
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex items-center space-x-2 bg-red-100 text-red-800 px-4 py-2 rounded-md animate-pulse">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
        <span className="text-sm font-medium">Выход выполнен!</span>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={handleSignOut}
        disabled={isLoading}
        className={`
          px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 
          ${isLoading 
            ? 'bg-gray-400 text-white cursor-not-allowed' 
            : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg transform hover:scale-105'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Выход...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Выйти</span>
          </div>
        )}
      </button>
      
      {error && (
        <div className="absolute top-full left-0 mt-2 bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-md text-sm whitespace-nowrap z-10">
          {error}
        </div>
      )}
    </div>
  )
}