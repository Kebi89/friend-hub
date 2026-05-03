'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { isUserLoggedIn } from '@/lib/auth'

export default function GalleryPage() {
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
            <div className="animate-pulse text-lg text-gray-500">Loading gallery...</div>
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
          <h1 className="text-4xl font-bold text-gray-800 mb-4">📸 Photo Gallery</h1>
          <p className="text-lg text-gray-600">All your shared memories in one place</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
              <div className="aspect-video bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                <span className="text-blue-600 text-4xl">📷</span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">Memory #{i}</h3>
                <p className="text-sm text-gray-600">Uploaded: Coming soon!</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
