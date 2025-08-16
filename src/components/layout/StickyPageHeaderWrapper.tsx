import { createServerClient } from '@/lib/supabase/server'
import { StickyPageHeader } from './StickyPageHeader'

interface StickyPageHeaderWrapperProps {
  title: string
  description?: string
}

export async function StickyPageHeaderWrapper({ title, description }: StickyPageHeaderWrapperProps) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <StickyPageHeader
      title={title}
      description={description}
      userEmail={user?.email || ''}
    />
  )
}