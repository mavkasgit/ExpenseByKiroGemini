import { createServerClient } from '@/lib/supabase/server'

export default async function DebugAuthPage() {
  const supabase = await createServerClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Auth Debug</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">User Info</h2>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify({ user, userError }, null, 2)}
              </pre>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Session Info</h2>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify({ session, sessionError }, null, 2)}
              </pre>
            </div>
          </div>
          
          <div className="mt-8 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Environment</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify({
                NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
                NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
                hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
              }, null, 2)}
            </pre>
          </div>
          
          <div className="mt-8 text-center">
            <a 
              href="/login" 
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-red-600">Auth Debug Error</h1>
          <div className="bg-white p-6 rounded-lg shadow">
            <pre className="bg-red-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    )
  }
}