'use client'

import { useState, useRef, useEffect } from 'react'
import { signOut } from '@/lib/actions/auth'
import { SettingsModal } from './SettingsModal'

interface UserMenuProps {
  userEmail: string
}

export function UserMenu({ userEmail }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Закрываем меню при клике вне его
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = async () => {
    setError(null)
    setIsSigningOut(true)
    setIsSuccess(false)

    try {
      const result = await signOut()
      if (result?.error) {
        setError(result.error)
        setIsSigningOut(false)
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
      setIsSigningOut(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex items-center space-x-3 bg-red-100 text-red-800 px-4 py-2 rounded-lg animate-pulse border border-red-200 shadow-lg">
        <div className="relative">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-300 border-t-red-600"></div>
          <div className="absolute inset-0 rounded-full bg-red-600 opacity-20 animate-ping"></div>
        </div>
        <div className="text-sm font-medium">
          <div className="flex items-center space-x-1">
            <span>Выход выполнен!</span>
            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-xs text-red-600 animate-bounce">Перенаправляем...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-3 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-lg px-3 py-2 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {userEmail.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium text-gray-900">
                {userEmail.split('@')[0]}
              </div>
              <div className="text-xs text-gray-500">
                {userEmail}
              </div>
            </div>
          </div>
          <svg 
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Выпадающее меню */}
        <div className={`
          absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50
          transition-all duration-200 origin-top-right
          ${isOpen 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
          }
        `}>
          <div className="py-2">
            {/* Информация о пользователе */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {userEmail.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {userEmail.split('@')[0]}
                  </div>
                  <div className="text-xs text-gray-500">
                    {userEmail}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2">
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <span>Настройки</span>
              </button>
            </div>

            {/* Кнопка выхода */}
            <div className="p-2 border-t border-gray-100">
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className={`
                  flex items-center w-full px-4 py-2 text-sm transition-all duration-200 rounded-md
                  ${isSigningOut 
                    ? 'text-gray-400 cursor-not-allowed bg-gray-50' 
                    : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                  }
                `}
              >
                {isSigningOut ? (
                  <>
                    <div className="relative mr-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600"></div>
                      <div className="absolute inset-0 rounded-full bg-gray-400 opacity-20 animate-pulse"></div>
                    </div>
                    <span className="animate-pulse">Выход...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="font-medium">Выйти</span>
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="mx-4 mt-2 mb-1 bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-md text-xs">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
    </>
  )
}