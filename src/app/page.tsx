import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Перенаправляем авторизованных пользователей на главную страницу
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
          Expense Tracker
        </h1>
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-center mb-6">
            Добро пожаловать в ваш персональный трекер расходов. Войдите в систему, чтобы продолжить.
          </p>
          <div className="flex flex-col space-y-4">
            <Link
              href="/login"
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors text-center"
            >
              Войти
            </Link>
            <Link
              href="/signup"
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors text-center"
            >
              Создать аккаунт
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}