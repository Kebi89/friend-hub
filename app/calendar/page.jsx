'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { isUserLoggedIn } from '@/lib/auth'

export default function CalendarPage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!isUserLoggedIn()) {
      router.push('/auth')
      return
    }
    setIsLoaded(true)
  }, [router])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="animate-pulse text-lg text-gray-500">Loading calendar...</div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">📅 Calendar</h1>
          <p className="text-lg text-gray-600">Plan your adventures and view birthdays</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-lg text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Let&apos;s Plan Together!</h2>
            <p className="opacity-90">Coordinate your next adventure</p>
          </div>

          <div className="min-h-[400px] flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <p className="text-gray-500 text-lg mb-2">Calendar View</p>
              <p className="text-gray-400 text-sm">Full calendar integration coming soon!</p>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
            <h3 className="font-semibold text-blue-900 mb-2">📌 Features:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• View all group birthdays</li>
              <li>• Plan upcoming trips</li>
              <li>• Share event details</li>
              <li>• Get reminders</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
