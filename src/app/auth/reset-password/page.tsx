import { ResetPasswordForm } from '@/components/forms/ResetPasswordForm'

export default async function ResetPasswordPage({
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Установить новый пароль
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Введите новый пароль для вашего аккаунта
          </p>
        </div>
        <ResetPasswordForm
          tokenHash={token_hash}
          token={token}
          email={email}
          code={code}
          type={type}
        />
      </div>
    </div>
  );
}