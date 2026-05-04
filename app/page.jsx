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
  const [friendsActivity, setFriendsActivity] = useState([])
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
        .limit(5)

      if (messagesData) {
        const formattedMessages = messagesData.map(msg => ({
          id: msg.id,
          user: msg.profiles?.display_name || msg.profiles?.nickname || 'Anonymous',
          text: msg.content.split(' ').slice(0, 3).join(' ') + '...',
          timestamp: msg.created_at,
          userEmail: msg.profiles?.email,
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

      // Load friend activity (last 3 actions from all users)
      const { data: activitiesData } = await supabase
        .rpc('get_recent_activities', {})

      if (activitiesData) {
        setFriendsActivity(activitiesData.slice(0, 3))
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
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back, {currentUser?.email?.split('@')[0]}! 👋</h1>
          <p className="text-gray-600">Here's what's happening in your Friends Hub</p>
        </div>

        {/* Main Tiles Grid - 6 tiles in 2 rows */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Messages Tile */}
          <Link href="/messages" className="block group h-full">
            <div className="bg-white rounded-xl shadow-md p-6 h-full flex flex-col transition-all group-hover:scale-105 hover:shadow-xl">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="bg-blue-100 rounded-lg p-3">
                  <div className="text-3xl">💬</div>
                </div>
                <div className="text-2xl text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0">→</div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 flex-shrink-0">Messages</h3>
              <p className="text-gray-600 mb-2 flex-shrink-0">
                <span className="text-2xl font-bold">{messages.length}</span> messages
              </p>
              {messages.length > 0 && (
                <p className="text-sm text-gray-500 line-clamp-2">Recent: {messages[0].text || 'No recent messages'}</p>
              )}
            </div>
          </Link>

          {/* Gallery Tile */}
          <Link href="/gallery" className="block group h-full">
            <div className="bg-white rounded-xl shadow-md p-6 h-full flex flex-col transition-all group-hover:scale-105 hover:shadow-xl">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="bg-green-100 rounded-lg p-3">
                  <div className="text-3xl">📸</div>
                </div>
                <div className="text-2xl text-gray-400 group-hover:text-green-600 transition-colors flex-shrink-0">→</div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 flex-shrink-0">Photo Gallery</h3>
              <p className="text-gray-600 mb-2 flex-shrink-0">
                <span className="text-2xl font-bold">{recentPhotos.length}</span> photos
              </p>
              {recentPhotos.length > 0 && (
                <p className="text-sm text-gray-500 line-clamp-2">Last: {recentPhotos[0].displayName}</p>
              )}
            </div>
          </Link>

          {/* Calendar Tile */}
          <Link href="/calendar" className="block group h-full">
            <div className="bg-white rounded-xl shadow-md p-6 h-full flex flex-col transition-all group-hover:scale-105 hover:shadow-xl">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="bg-purple-100 rounded-lg p-3">
                  <div className="text-3xl">📅</div>
                </div>
                <div className="text-2xl text-gray-400 group-hover:text-purple-600 transition-colors flex-shrink-0">→</div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 flex-shrink-0">Calendar</h3>
              <p className="text-gray-600 mb-2 flex-shrink-0">
                <span className="text-2xl font-bold">{upcomingEvents.length}</span> upcoming events
              </p>
              {upcomingEvents.length > 0 && (
                <p className="text-sm text-gray-500 line-clamp-2">Next: {upcomingEvents[0].title}</p>
              )}
            </div>
          </Link>

          {/* Events Tile */}
          <Link href="/events" className="block group h-full">
            <div className="bg-white rounded-xl shadow-md p-6 h-full flex flex-col transition-all group-hover:scale-105 hover:shadow-xl">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="bg-orange-100 rounded-lg p-3">
                  <div className="text-3xl">🎉</div>
                </div>
                <div className="text-2xl text-gray-400 group-hover:text-orange-600 transition-colors flex-shrink-0">→</div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 flex-shrink-0">Events</h3>
              <p className="text-gray-600 mb-2 flex-shrink-0">Plan your next adventure</p>
              <p className="text-sm text-gray-500 line-clamp-2">
                Create events with details, checklists & costs
              </p>
            </div>
          </Link>

          {/* Recent Activity Tile */}
          <Link href="/messages" className="block group h-full">
            <div className="bg-white rounded-xl shadow-md p-6 h-full flex flex-col transition-all group-hover:scale-105 hover:shadow-xl">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="bg-pink-100 rounded-lg p-3">
                  <div className="text-3xl">👥</div>
                </div>
                <Link href="/messages" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex-shrink-0">View All →</Link>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 flex-shrink-0">Recent Activity</h3>
              <div className="space-y-2 overflow-hidden flex-grow">
                {friendsActivity.length === 0 && messages.length === 0 && (
                  <p className="text-gray-500 text-sm">No recent activity</p>
                )}
                {[...friendsActivity, ...messages].slice(0, 4).map((activity, index) => (
                  <div key={index} className="text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      <span className="font-medium text-gray-900 truncate">{activity.user}</span>
                    </div>
                    <p className="text-gray-600 text-xs ml-4 truncate">{activity.text || activity.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </Link>

          {/* Quick Actions Tile */}
          <Link href="/messages" className="block group h-full">
            <div className="bg-white rounded-xl shadow-md p-6 h-full flex flex-col transition-all group-hover:scale-105 hover:shadow-xl">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex-shrink-0">Quick Actions</h3>
              <div className="space-y-2 overflow-hidden flex-grow">
                <Link href="/messages">
                  <Button variant="outline" className="w-full justify-start h-10">
                    <span className="mr-2">💬</span> Post Message
                  </Button>
                </Link>
                <Link href="/gallery">
                  <Button variant="outline" className="w-full justify-start h-10">
                    <span className="mr-2">📸</span> Upload Photo
                  </Button>
                </Link>
                <Link href="/events">
                  <Button variant="outline" className="w-full justify-start h-10">
                    <span className="mr-2">🎉</span> Create Event
                  </Button>
                </Link>
              </div>
            </div>
          </Link>

        </div>

        {/* Upcoming Events Section */}
        {upcomingEvents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📅 Upcoming Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.slice(0, 3).map((event) => (
                <div key={event.id} className="bg-white rounded-xl shadow-md p-6 group hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800">{event.title}</h3>
                    <Link href="/events" className="text-gray-400 group-hover:text-blue-600 transition-colors">→</Link>
                  </div>
                  <p className="text-gray-600 mb-2">
                    <span className="font-semibold">📅 {event.displayDate}</span>
                  </p>
                  {event.description && (
                    <p className="text-gray-700 text-sm line-clamp-3">{event.description}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link href="/events">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl">
                  View All Events →
                </Button>
              </Link>
            </div>
          </div>
        )}
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