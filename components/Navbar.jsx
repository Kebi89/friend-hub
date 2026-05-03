'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-blue-600 flex items-center gap-2">
            <span>🌟</span> Friends Hub
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/">Home</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/gallery">Gallery</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/messages">Messages</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/calendar">Calendar</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
