import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />

      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Friends Hub</h1>
          <p className="text-xl opacity-90">A shared space for all our adventures and memories</p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8">
        {/* Photo Gallery */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">📸 Photo Gallery</h2>
          <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
            Memories from our amazing trips and adventures!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                <div className="aspect-video bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                  <span className="text-blue-600 text-4xl">📷</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">Trip Memory #{i}</h3>
                  <p className="text-sm text-gray-600">Capture date: Coming soon!</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Message Board - Teaser */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-800">💬 Message Board</h2>
          <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
            Share your favorite memories and messages with your friends!
          </p>
          <Button className="w-full md:w-auto">
            <Link href="/messages">Browse Messages</Link>
          </Button>
        </section>

        {/* Calendar - Teaser */}
        <section>
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-800">📅 Trip Calendar</h2>
          <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
            Plan and track your future adventures together!
          </p>
          <Button className="w-full md:w-auto">
            <Link href="/calendar">View Calendar</Link>
          </Button>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2">© 2024 Friends Hub • Made with ❤️</p>
          <p className="text-sm text-gray-400">Built with Next.js + Tailwind CSS + Shadcn UI</p>
        </div>
      </footer>
    </div>
  )
}
