import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export default async function SimpleAuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams

  const supabase = await createServerClient()

  try {
    // Сначала попробуем обработать код, если он есть
    if (params.code && typeof params.code === 'string') {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code)

      if (exchangeError) {
        console.error('Code exchange error:', exchangeError?.message)
        redirect('/login?error=exchange-error')
      }

      if (data?.user) {
        revalidatePath('/', 'layout')
        redirect('/dashboard')
      }
    }

    // Если нет кода, проверяем существующую сессию
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Session error:', sessionError?.message)
      redirect('/login?error=session-error')
    }

    if (session?.user) {
      revalidatePath('/', 'layout')
      redirect('/dashboard')
    } else {
      redirect('/login?error=no-session')
    }
  } catch (err: any) {
    console.error('Callback error:', err?.message ?? err)
    redirect('/login?error=callback-error')
  }
}