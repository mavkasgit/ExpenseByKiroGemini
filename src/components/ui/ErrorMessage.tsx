'use client'

import { useState, useEffect } from 'react'
import { translateAuthError } from '@/lib/utils/errorMessages'

interface ErrorMessageProps {
  error: string
  onDismiss?: () => void
  showDismiss?: boolean
}

export function ErrorMessage({ error, onDismiss, showDismiss = false }: ErrorMessageProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isShaking, setIsShaking] = useState(false)
  
  const { message, suggestion, icon } = translateAuthError(error)

  useEffect(() => {
    // Добавляем эффект тряски при появлении ошибки
    setIsShaking(true)
    const timer = setTimeout(() => setIsShaking(false), 500)
    return () => clearTimeout(timer)
  }, [error])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => {
      onDismiss?.()
    }, 300)
  }

  if (!isVisible) return null

  return (
    <div className={`
      rounded-lg bg-red-50 border border-red-200 p-4 transition-all duration-300
      ${isShaking ? 'animate-shake' : ''}
      ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
    `}>
      <div className="flex items-start space-x-3">
        {/* Иконка */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-lg">{icon}</span>
          </div>
        </div>
        
        {/* Содержимое */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-red-800 mb-1">
                {message}
              </h3>
              {suggestion && (
                <p className="text-sm text-red-600 leading-relaxed">
                  {suggestion}
                </p>
              )}
            </div>
            
            {/* Кнопка закрытия */}
            {showDismiss && (
              <button
                onClick={handleDismiss}
                className="ml-3 flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Дополнительные действия */}
          {message.includes('пароль') && (
            <div className="mt-3">
              <a
                href="/forgot-password"
                className="text-sm text-red-600 hover:text-red-800 font-medium underline decoration-red-300 hover:decoration-red-500 transition-colors"
              >
                Забыли пароль? →
              </a>
            </div>
          )}
          
          {message.includes('зарегистрирован') && (
            <div className="mt-3 flex space-x-4">
              <a
                href="/login"
                className="text-sm text-red-600 hover:text-red-800 font-medium underline decoration-red-300 hover:decoration-red-500 transition-colors"
              >
                Войти →
              </a>
              <a
                href="/forgot-password"
                className="text-sm text-red-600 hover:text-red-800 font-medium underline decoration-red-300 hover:decoration-red-500 transition-colors"
              >
                Восстановить пароль →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}