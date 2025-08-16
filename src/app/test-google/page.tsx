import { GoogleSignInButton } from '@/components/forms/GoogleSignInButton'

export default function TestGooglePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <h1 className="text-2xl font-bold text-center">Test Google Button</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Google Sign In Button Test</h2>
          <GoogleSignInButton />
        </div>
        
        <div className="text-center">
          <a href="/login" className="text-indigo-600 hover:text-indigo-800">
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  )
}