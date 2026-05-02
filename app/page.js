'use client'

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="text-xl font-bold text-blue-600">🇫🇷 Friends Trip</div>
          <div className="flex gap-4">
            <Button variant="ghost">Gallery</Button>
            <Button variant="ghost">Messages</Button>
            <Button variant="ghost">Calendar</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Friends France Trip 2024</h1>
          <p className="text-xl opacity-90">Our Annual Adventure in the City of Light</p>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Photo Gallery */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">📸 Photo Gallery</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">Photo {i}</span>
                </div>
                <div className="p-4">
                  <p className="font-medium">Trip Memory #{i}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Message Board */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">💬 Message Board</h2>
          <Card className="p-6">
            <div className="mb-6">
              <Textarea placeholder="Share your memories..." className="mb-4" />
              <Button className="w-full md:w-auto">Post Message</Button>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border-l-4 border-blue-500 pl-4 py-2">
                  <p className="font-medium">User {i}</p>
                  <p className="text-gray-600">Great memory from our trip!</p>
                  <p className="text-sm text-gray-400">2 hours ago</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* Calendar */}
        <section>
          <h2 className="text-3xl font-bold text-center mb-8">📅 Trip Calendar</h2>
          <Card className="p-6">
            <div className="bg-gray-100 h-96 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Google Calendar Integration</p>
            </div>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 text-center">
        <p>© 2024 Friends France Trip • Made with ❤️</p>
      </footer>
    </div>
  )
}