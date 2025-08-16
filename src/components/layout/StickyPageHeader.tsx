'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { UserMenu } from './UserMenu'

interface StickyPageHeaderProps {
  title: string
  description?: string
  userEmail?: string
}

export function StickyPageHeader({ title, description, userEmail }: StickyPageHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    {
      href: '/dashboard',
      label: '🏠 Главная',
      isActive: pathname === '/dashboard'
    },
    {
      href: '/expenses/add',
      label: '➕ Добавить',
      isActive: pathname === '/expenses/add'
    },
    {
      href: '/expenses',
      label: '💰 Расходы',
      isActive: pathname.startsWith('/expenses') && !pathname.startsWith('/expenses/add')
    },
    {
      href: '/categories',
      label: '📂 Категории',
      isActive: pathname === '/categories'
    }
  ]

  return (
    <div className={`sticky top-0 z-40 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white shadow-lg border-b border-gray-200' 
        : 'bg-white border-b border-gray-100'
    }`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Навигационные кнопки слева */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={item.isActive ? "primary" : "ghost"}
                  size="sm"
                  className={`transition-all duration-200 ${
                    item.isActive 
                      ? 'shadow-sm' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Заголовок по центру */}
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold text-gray-900">
              {title}
            </h1>
            {description && (
              <p className="text-xs text-gray-600 mt-1">
                {description}
              </p>
            )}
          </div>

          {/* Профиль пользователя справа */}
          <div className="w-[280px] flex justify-end">
            {userEmail && <UserMenu userEmail={userEmail} />}
          </div>
        </div>
      </div>
    </div>
  )
}