'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { isUserLoggedIn, getCurrentUser } from '@/lib/auth'

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [recentPhotos, setRecentPhotos] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const logged = isUserLoggedIn()
    const user = logged ? getCurrentUser() : null
    
    setIsAuthenticated(logged)
    setCurrentUser(user)
    setIsLoaded(true)

    // If NOT logged in, show landing page (nothing to redirect to)
    if (!logged) {
      return
    }

    // If logged in, load dashboard data
    // Recent messages (from localStorage)
    const storedMessages = localStorage.getItem('hubMessages')
    if (storedMessages) {
      const parsed = JSON.parse(storedMessages)
      setMessages(parsed.slice(0, 3)) // Show last 3
    }

    // Mock upcoming events (will connect to events page later)
    setUpcomingEvents([
      { id: 1, title: 'Paris Adventure 2024', date: '2026-06-15' },
      { id: 2, title: 'Birthday Party', date: '2026-05-20' },
    ])

    // Mock recent photos (will connect to gallery later)
    setRecentPhotos([
      { id: 1, src: '📷', cap: 'Beach Sunset' },
      { id: 2, src: '📷', cap: 'Mountain Hike' },
      { id: 3, src: '📷', cap: 'City Lights' },
    ])
  }, [router])

  // Show landing page (no login)
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

  // LANDING PAGE (User not logged in)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo */}
            <div className="mb-8">
              <div className="text-8xl mb-4">🌟</div>
              <h1 className="text-6xl font-bold text-gray-900 mb-4">
                Friends Hub
              </h1>
              <p className="text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                A shared space for all your adventures and memories. 
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
              <Link href="/auth?mode=signin">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-full">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth?mode=signup">
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
              <Link href="/auth?mode=signin" className="text-blue-600 hover:text-blue-700 font-semibold">
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

  // DASHBOARD PAGE (User IS logged in)
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome Back, {currentUser?.displayName}! 👋</h1>
          <p className="text-gray-600">Here's what's happening in your Friends Hub</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Upcoming Events */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">📅 Upcoming Events</h2>
              <Link href="/events" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All →
              </Link>
            </div>
            {upcomingEvents.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No upcoming events</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="border-l-4 border-blue-500 pl-3 py-1">
                    <p className="font-medium text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-600">{new Date(event.date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Latest Photos */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">📸 Latest Photos</h2>
              <Link href="/gallery" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View Gallery →
              </Link>
            </div>
            {recentPhotos.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No photos yet</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {recentPhotos.map((photo) => (
                  <div key={photo.id} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">{photo.src}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Messages */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">💬 Recent Messages</h2>
              <Link href="/messages" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All →
              </Link>
            </div>
            {messages.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-2">No messages yet</p>
                <Link href="/messages">
                  <Button size="sm">Post First Message</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {messages.map((msg) => (
                  <div key={msg.id} className="border-l-4 border-blue-500 pl-3 py-2 bg-blue-50 rounded-r">
                    <p className="text-sm font-semibold text-gray-900">{msg.user}</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{msg.text}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(msg.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">⚡ Quick Actions</h2>
            <div className="space-y-2">
              <Link href="/messages">
                <Button className="w-full justify-start" variant="outline">
                  <span className="mr-2">💬</span> Post Message
                </Button>
              </Link>
              <Link href="/gallery">
                <Button className="w-full justify-start" variant="outline">
                  <span className="mr-2">📸</span> Upload Photo
                </Button>
              </Link>
              <Link href="/events">
                <Button className="w-full justify-start" variant="outline">
                  <span className="mr-2">📅</span> Create Event
                </Button>
              </Link>
              <Link href="/profile">
                <Button className="w-full justify-start" variant="outline">
                  <span className="mr-2">👤</span> Edit Profile
                </Button>
              </Link>
            </div>
          </div>

          {/* Calendar Preview */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">📅 Calendar Overview</h2>
              <Link href="/calendar" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View Calendar →
              </Link>
            </div>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 rounded-lg">
              <p className="text-sm opacity-90">Your Friends Hub calendar</p>
              <p className="text-2xl font-bold mt-2">{new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          {/* Activity Status */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">👥 Member Activity</h2>
            <div className="text-center py-6">
              <div className="text-4xl mb-2">🤝</div>
              <p className="text-gray-600">Friends connected</p>
              <p className="text-sm text-gray-500 mt-1">Just you for now - invite more friends!</p>
              <Link href="/messages">
                <Button size="sm" className="mt-3">Invite Friends</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
