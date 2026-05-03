'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { isUserLoggedIn } from '@/lib/auth'

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const logged = isUserLoggedIn()
    setIsAuthenticated(logged)

    if (logged) {
      // Redirect authenticated users to messages or home
      setTimeout(() => {
        router.push('/messages')
      }, 500)
    }

    setIsLoaded(true)
  }, [router])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If authenticated, show nothing (already redirected)
  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Welcome Hero */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="mb-8">
            <div className="text-8xl mb-4">🌟</div>
            <h1 className="text-6xl font-bold text-gray-900 mb-4">
              Friends Hub
            </h1>
            <p className="text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              A shared space for all **your** adventures and memories. 
              Create your account to get started.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Messages Card */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">💬</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Message Board</h3>
              <p className="text-gray-600">Share memories, thoughts, and jokes with your friends</p>
            </div>

            {/* Photos Card */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">📸</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Photo Gallery</h3>
              <p className="text-gray-600">Share and view photos from all your adventures together</p>
            </div>

            {/* Calendar Card */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">📅</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Shared Calendar</h3>
              <p className="text-gray-600">Track birthdays, plan trips, and coordinate events</p>
            </div>
          </div>

          {/* Login Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link href="/auth">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-full">
                Sign In
              </Button>
            </Link>
            <Link href="/auth">
              <Button size="lg" variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg rounded-full">
                Create Account
              </Button>
            </Link>
          </div>

          {/* Privacy Badge */}
          <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div className="text-left">
                <h3 className="font-semibold text-blue-900">100% Private & Local</h3>
                <p className="text-sm text-blue-800">
                  All your data stays on your device. No cloud, no third-party storage. 
                  Works offline and never leaves your network.
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-12">
            <p className="text-gray-600 mb-4">Already have an account?</p>
            <Link href="/auth" className="text-blue-600 hover:text-blue-700 font-semibold">
              Sign in here →
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-auto">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-gray-400">
            © 2026 Friends Hub • Privacy-focused • Local-first • No cloud
          </p>
        </div>
      </footer>
    </div>
  )
}