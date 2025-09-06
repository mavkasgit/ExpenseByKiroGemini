import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export default async function SimpleAuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  console.log('Simple callback params:', params)
  
  const supabase = await createServerClient()
  
  try {
    // Сначала попробуем обработать код, если он есть
    if (params.code && typeof params.code === 'string') {
      console.log('Found code, attempting to exchange for session...')
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code)
      
      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        redirect('/login?error=exchange-error')
      }
      
      if (data?.user) {
        console.log('User authenticated via code exchange:', data.user.email)
        revalidatePath('/', 'layout')
        redirect('/dashboard')
      }
    }
    
    // Если нет кода, проверяем существующую сессию
    console.log('Checking existing session...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      redirect('/login?error=session-error')
    }
    
    if (session?.user) {
      console.log('User found in existing session:', session.user.email)
      revalidatePath('/', 'layout')
      redirect('/dashboard')
    } else {
      console.log('No session found, redirecting to login')
      redirect('/login?error=no-session')
    }
  } catch (err) {
    console.error('Callback error:', err)
    redirect('/login?error=callback-error')
  }
}