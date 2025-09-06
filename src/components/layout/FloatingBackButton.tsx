'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface FloatingBackButtonProps {
  href: string
  label: string
  icon?: React.ReactNode
}

export function FloatingBackButton({ href, label, icon }: FloatingBackButtonProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      // Показываем кнопку после прокрутки на 100px
      if (window.pageYOffset > 100) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  return (
    <div className={cn(
      'fixed bottom-6 left-6 z-50 transition-all duration-300 transform',
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
    )}>
      <Link
        href={href}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'group flex items-center bg-white hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-indigo-300',
          isHovered ? 'pl-4 pr-6 py-3' : 'p-3'
        )}
      >
        {/* Иконка */}
        <div className="flex items-center justify-center w-6 h-6 transition-transform duration-300 group-hover:-translate-x-1">
          {icon || (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          )}
        </div>
        
        {/* Текст (появляется при наведении) */}
        <span className={cn(
          'ml-3 font-medium text-sm whitespace-nowrap transition-all duration-300 overflow-hidden',
          isHovered ? 'max-w-xs opacity-100' : 'max-w-0 opacity-0'
        )}>
          {label}
        </span>
        
        {/* Пульсирующий эффект */}
        <div className="absolute inset-0 rounded-full bg-indigo-400 opacity-20 animate-ping" 
             style={{ animationDuration: '3s' }} />
      </Link>
    </div>
  )
}