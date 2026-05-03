'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { loginUser, registerUser } from '@/lib/auth'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (isLogin) {
      // Login
      const success = loginUser(email, password)
      if (success) {
        router.push('/')
      } else {
        setError('Invalid email or password')
      }
    } else {
      // Register
      if (!displayName.trim()) {
        setError('Please enter your display name')
        setLoading(false)
        return
      }

      const success = registerUser(email, password, displayName)
      if (success) {
        router.push('/')
      } else {
        setError('Registration failed. Email may already be in use.')
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          {/* Auth Card */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
              {isLogin ? 'Welcome Back!' : 'Create Your Account'}
            </h1>
            <p className="text-center text-gray-600 mb-6">
              {isLogin 
                ? 'Sign in to access your Friends Hub' 
                : 'Join Friends Hub to get started'}
            </p>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-6 rounded">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">This will appear on all your messages</p>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  placeholder="Create a password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            {/* Toggle between login/register */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin)
                    setError('')
                  }}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>

            {/* Info */}
            <div className="mt-8 bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
              <h3 className="font-semibold text-blue-900 mb-2 text-sm">Privacy Notice</h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Your data is stored locally in your browser</li>
                <li>• No data leaves your device</li>
                <li>• Works offline - no internet required</li>
                <li>• Your password is hashed before storage</li>
              </ul>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-6">
            <Link href="/" className="text-gray-600 hover:text-gray-800 text-sm">
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
