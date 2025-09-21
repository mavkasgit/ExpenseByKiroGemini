import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    token_hash?: string; 
    type?: string;
    token?: string;
    email?: string;
    code?: string;
  }>
}) {
  const params = await searchParams
  const { token_hash, type, token, email, code } = params

  let message = 'Подтверждение...'
  let isError = false
  let shouldRedirect = false
  const supabase = await createServerClient()

  // Сначала проверяем, есть ли OAuth код
  if (code) {
    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('OAuth code exchange error:', exchangeError?.message)
        message = 'Ошибка при входе через Google'
        isError = true
      } else if (data?.user) {
        message = 'Вход через Google успешен! Перенаправляем на главную...'
        shouldRedirect = true
      }
    } catch (err: any) {
      console.error('OAuth exception:', err?.message ?? err)
      message = 'Ошибка при обработке входа через Google'
      isError = true
    }
  }

  // Если нет OAuth кода, проверяем email подтверждение
  if (!code) {
    if (token_hash && type) {
      // Новый формат с token_hash
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as any,
      })

      if (error) {
        console.error('Ошибка подтверждения (token_hash):', error?.message)
        message = 'Ошибка подтверждения email. Попробуйте еще раз.'
        isError = true
      } else {
        message = 'Email успешно подтвержден! Перенаправляем на главную...'
        shouldRedirect = true
      }
    } else if (token && type) {
      // Старый формат с token
      const { error } = await supabase.auth.verifyOtp({
        token,
        type: type as any,
        email: email || '',
      })

      if (error) {
        console.error('Ошибка подтверждения (token):', error?.message)
        message = 'Ошибка подтверждения email. Попробуйте еще раз.'
        isError = true
      } else {
        message = 'Email успешно подтвержден! Перенаправляем на главную...'
        shouldRedirect = true
      }
    } else {
      // Проверяем существующую сессию
      const { data: { user } } = await supabase.auth.getUser()

      if (user && user.email_confirmed_at) {
        message = 'Email уже подтвержден! Перенаправляем на главную...'
        shouldRedirect = true
      } else {
        console.error('Отсутствуют параметры подтверждения')
        message = 'Неверная ссылка подтверждения. Возможно, ссылка устарела или уже была использована.'
        isError = true
      }
    }
  }

  // Выполняем redirect только в конце, если нужно
  if (shouldRedirect) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {code ? 'Вход через Google' : 'Подтверждение Email'}
          </h2>
        </div>
        <div className={`bg-white p-6 rounded-lg shadow-md ${isError ? 'border-l-4 border-red-500' : 'border-l-4 border-green-500'}`}>
          <p className={`text-center ${isError ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </p>
          {!isError && (
            <div className="mt-4 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            </div>
          )}
          {isError && (
            <div className="mt-4 text-center">
              <a
                href="/login"
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Перейти к входу →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}