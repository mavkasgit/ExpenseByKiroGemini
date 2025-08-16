import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('OAuth callback route:', { code: !!code, next })

  if (code) {
    const supabase = await createServerClient()
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('OAuth code exchange error:', error)
        return NextResponse.redirect(`${origin}/login?error=oauth-error`)
      }
      
      if (data.session) {
        console.log('OAuth session created successfully for:', data.session.user.email)
        return NextResponse.redirect(`${origin}${next}`)
      }
    } catch (err) {
      console.error('OAuth callback exception:', err)
      return NextResponse.redirect(`${origin}/login?error=exchange-exception`)
    }
  }

  console.log('No code provided in OAuth callback')
  return NextResponse.redirect(`${origin}/login?error=no-code`)
}