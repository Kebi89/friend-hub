'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { isUserLoggedIn } from '@/lib/auth'

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [recentPhotos, setRecentPhotos] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const logged = isUserLoggedIn()
      
      if (!logged) {
        setIsAuthenticated(false)
        setIsLoaded(true)
        setLoading(false)
        return
      }

      try {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)
        setIsAuthenticated(true)
        setIsLoaded(true)
        
        // Now load real data
        await loadRealData()
      } catch (error) {
        console.error('Error checking auth:', error)
        setIsAuthenticated(false)
        setIsLoaded(true)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const loadRealData = async () => {
    try {
      // Load recent messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select(`
          *,
          profiles (
            id,
            display_name,
            nickname
          )
        `)
        .order('created_at', { ascending: false })
        .limit(3)

      if (messagesData) {
        const formattedMessages = messagesData.map(msg => ({
          id: msg.id,
          user: msg.profiles?.display_name || msg.profiles?.nickname || 'Anonymous',
          text: msg.content,
          timestamp: msg.created_at,
        }))
        setMessages(formattedMessages)
      }

      // Load recent photos
      const { data: photosData } = await supabase
        .from('photos')
        .select(`
          *,
          profiles (
            id,
            display_name,
            nickname
          )
        `)
        .order('created_at', { ascending: false })
        .limit(6)

      if (photosData) {
        const loadedPhotos = await Promise.all(
          photosData.map(async (photo) => {
            const { data: publicUrlData } = await supabase.storage
              .from('photos')
              .getPublicUrl(photo.url)

            return {
              ...photo,
              publicUrl: publicUrlData.publicUrl,
              displayName: photo.profiles?.display_name || photo.profiles?.nickname || 'Anonymous',
            }
          })
        )
        setRecentPhotos(loadedPhotos)
      }

      // Load upcoming events
      const { data: eventsData } = await supabase
        .from('events')
        .select(`
          *,
          profiles (
            id,
            display_name,
            nickname
          )
        `)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .limit(5)

      if (eventsData) {
        const formattedEvents = eventsData.map(event => {
          const eventDate = new Date(event.event_date)
          return {
            ...event,
            displayDate: eventDate.toLocaleDateString(undefined, { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            }),
            isMultiDay: event.multi_day === true,
          }
        })
        setUpcomingEvents(formattedEvents)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <div className="text-8xl mb-4">🌟</div>
              <h1 className="text-6xl font-bold text-gray-900 mb-4">Friends Hub</h1>
              <p className="text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                A shared space for all your adventures and memories. 
                Create your account to get started.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-3">💬</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Message Board</h3>
                <p className="text-gray-600">Share memories, thoughts, and jokes with your friends</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-3">📸</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Photo Gallery</h3>
                <p className="text-gray-600">Share and view photos from all your adventures together</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-3">📅</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Shared Calendar</h3>
                <p className="text-gray-600">Track birthdays, plan trips, and coordinate events</p>
              </div>
            </div>

            <div className="space-y-2">
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

            <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-6 max-w-2xl mx-auto mt-6">
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
          </div>
        </div>

        <footer className="bg-gray-900 text-white py-8 mt-auto">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-gray-400">
              © 2026 Friends Hub • Privacy-focused • Local-first • No cloud
            </p>
          </div>
        </footer>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome Back, {currentUser?.email?.split('@')[0]}! 👋</h1>
          <p className="text-gray-600">Here's what's happening in your Friends Hub</p>
        </div>

        {/* Quick Access Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/messages" className="block">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">💬</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Messages</h3>
              <p className="text-gray-600 text-sm">
                {messages.length} {messages.length === 1 ? 'message' : 'messages'}
              </p>
              <div className="mt-4">
                <Button variant="link" className="px-0 text-blue-600 hover:text-blue-700">
                  View Messages →
                </Button>
              </div>
            </div>
          </Link>

          <Link href="/gallery" className="block">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">📸</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Gallery</h3>
              <p className="text-gray-600 text-sm">
                {recentPhotos.length} {recentPhotos.length === 1 ? 'photo' : 'photos'}
              </p>
              <div className="mt-4">
                <Button variant="link" className="px-0 text-blue-600 hover:text-blue-700">
                  View Gallery →
                </Button>
              </div>
            </div>
          </Link>

          <Link href="/calendar" className="block">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">📅</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Calendar</h3>
              <p className="text-gray-600 text-sm">
                {upcomingEvents.length} {upcomingEvents.length === 1 ? 'event' : 'events'} coming up
              </p>
              <div className="mt-4">
                <Button variant="link" className="px-0 text-blue-600 hover:text-blue-700">
                  View Calendar →
                </Button>
              </div>
            </div>
          </Link>

          <Link href="/events" className="block">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Events</h3>
              <p className="text-gray-600 text-sm">Plan and manage trips</p>
              <div className="mt-4">
                <Button variant="link" className="px-0 text-blue-600 hover:text-blue-700">
                  Create Event →
                </Button>
              </div>
            </div>
          </Link>
        </div>

        {/* Upcoming Events */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">📅 Upcoming Events</h2>
            <Link href="/events">
              <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
                View All Events →
              </Button>
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-500 mb-4">No upcoming events</p>
              <Link href="/events">
                <Button>
                  Plan Your First Event 🎉
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingEvents.slice(0, 4).map((event) => {
                const eventDate = new Date(event.event_date)
                return (
                  <div key={event.id} className="bg-white border-l-4 border-blue-500 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{event.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <span>📅 {event.displayDate}</span>
                          {event.is_multi_day && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded">Multi-day</span>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-700 mt-2 line-clamp-2">{event.description}</p>
                        )}
                      </div>
                      <Link href={`/events`} className="text-blue-600 hover:text-blue-700 text-sm ml-2">
                        Details →
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Photos */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">📸 Recent Photos</h2>
            <Link href="/gallery">
              <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
                View All Photos →
              </Button>
            </Link>
          </div>

          {recentPhotos.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-500 mb-4">No photos yet</p>
              <Link href="/gallery">
                <Button>
                  Upload Your First Photo 📸
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {recentPhotos.slice(0, 6).map((photo) => (
                <a key={photo.id} href={`/gallery`} className="group block">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    <img
                      src={photo.publicUrl}
                      alt="Gallery"
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-1 truncate">{photo.displayName}</p>
                </a>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-8 mt-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">
            © 2026 Friends Hub • {messages.length} message{messages.length !== 1 ? 's' : ''} • {recentPhotos.length} photo{recentPhotos.length !== 1 ? 's' : ''} • {upcomingEvents.length} event{upcomingEvents.length !== 1 ? 's' : ''}
          </p>
        </div>
      </footer>
    </div>
  )
}