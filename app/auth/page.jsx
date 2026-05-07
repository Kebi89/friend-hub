'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, LockKeyhole } from 'lucide-react'
import { PageShell, SectionCard } from '@/components/ui/page-shell'
import { signIn, signUp } from '@/lib/auth'

export default function AuthPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Check URL params for signup or signin mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const mode = urlParams.get('mode')
    if (mode === 'signup') {
      setIsLogin(false)
    } else if (mode === 'signin') {
      setIsLogin(true)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (isLogin) {
      // Sign in
      const result = await signIn(email, password)
      if (result.success && result.user) {
        router.push('/')
      } else {
        setError('Invalid email or password')
      }
    } else {
      // Sign up
      if (!displayName.trim()) {
        setError('Please enter your display name')
        setLoading(false)
        return
      }

      if (!password.trim() || password.length < 6) {
        setError('Password must be at least 6 characters')
        setLoading(false)
        return
      }

      const result = await signUp(email, password, displayName, null, null, null)
      if (result.success && result.user) {
        router.push('/profile')
      } else {
        setError('Registration failed. Email may already be in use.')
      }
    }

    setLoading(false)
  }

  return (
    <PageShell className="py-12">
        <div className="max-w-md mx-auto">
          {/* Auth Card */}
          <SectionCard className="p-8">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <LockKeyhole className="h-6 w-6" />
            </div>
            <h1 className="text-center text-3xl font-bold text-foreground mb-2">
              {isLogin ? 'Welcome Back!' : 'Create Your Account'}
            </h1>
            <p className="text-center text-muted-foreground mb-6">
              {isLogin 
                ? 'Sign in to access your Friends Hub' 
                : 'Join Friends Hub to get started'}
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Display Name (registration only) */}
              {!isLogin && (
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2 focus:ring-2 focus:ring-primary/20"
                    required
                  />
                  <p className="mt-1 text-xs text-muted-foreground">This will appear on all your messages</p>
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 focus:ring-2 focus:ring-primary/20"
                  required
                  minLength={6}
                />
                <p className="mt-1 text-xs text-muted-foreground">Minimum 6 characters</p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            {/* Toggle between login/register */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin)
                    setError('')
                  }}
                  className="font-semibold text-primary hover:text-primary/80"
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>

            {/* Info */}
            <div className="mt-8 rounded-lg border border-border bg-muted p-4">
              <h3 className="font-semibold text-foreground mb-2 text-sm">Privacy Notice</h3>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>Your account is managed by Supabase Auth.</li>
                <li>Shared content is stored in the Supabase database.</li>
                <li>Your session is kept in browser storage.</li>
                <li>Your password is handled by Supabase, not this app.</li>
              </ul>
            </div>
          </SectionCard>

          {/* Back to Home */}
          <div className="text-center mt-6">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
    </PageShell>
  )
}
