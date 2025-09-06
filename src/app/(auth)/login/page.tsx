import { LoginForm } from '@/components/forms/LoginForm'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string; error?: string }>
}) {
  const params = searchParams ? await searchParams : {}
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Войти в аккаунт
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Или{' '}
            <Link
              href="/signup"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              создайте новый аккаунт
            </Link>
          </p>
        </div>
        
        {params?.message === 'password-updated' && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-700 text-center">
              Пароль успешно обновлен! Теперь вы можете войти с новым паролем.
            </div>
          </div>
        )}
        
        {params?.error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700 text-center">
              {params.error === 'oauth-error' && 'Ошибка OAuth аутентификации'}
              {params.error === 'auth-error' && 'Ошибка при обмене кода на сессию'}
              {params.error === 'no-user-data' && 'Не удалось получить данные пользователя'}
              {params.error === 'exchange-exception' && 'Произошла ошибка при аутентификации'}
              {!['oauth-error', 'auth-error', 'no-user-data', 'exchange-exception'].includes(params.error) && 'Произошла ошибка при входе'}
            </div>
          </div>
        )}
        
        <LoginForm />
      </div>
    </div>
  );
}