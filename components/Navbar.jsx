'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { requireCurrentUser, signOut as supabaseSignOut } from '@/lib/auth'

export default function Navbar({ isAuthenticated = null, user = null }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [authState, setAuthState] = useState({
    isLogged: isAuthenticated !== null ? isAuthenticated : false,
    user: user || null,
    userId: null,
  })
  const router = useRouter()

  // Use provided auth state or check locally
  useEffect(() => {
    if (isAuthenticated !== null || user) return

    const checkAuth = async () => {
      const currentUser = await requireCurrentUser()
      setAuthState({
        isLogged: !!currentUser,
        user: currentUser,
        userId: currentUser?.id || null,
      })
    }

    checkAuth()
    const interval = setInterval(checkAuth, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [isAuthenticated, user])

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await supabaseSignOut()
      setAuthState({ isLogged: false, user: null, userId: null })
      router.push('/auth')
    }
  }

  // Desktop nav links (always visible)
  const navLinks = [
    { href: '/messages', label: 'Messages', requireAuth: true },
    { href: '/gallery', label: 'Gallery', requireAuth: true },
    { href: '/calendar', label: 'Calendar', requireAuth: true },
    { href: '/events', label: 'Events', requireAuth: true },
  ]

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-blue-600 flex items-center gap-2">
            <span>🌟</span> Friends Hub
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2">
            {/* Auth Links */}
            {!authState.isLogged ? (
              <Button variant="ghost" asChild>
                <Link href="/auth">Sign In</Link>
              </Button>
            ) : (
              <>
                {/* Always show Home link */}
                <Button variant="ghost" asChild>
                  <Link href="/">Home</Link>
                </Button>

                {/* Auth-only links */}
                {navLinks.filter(link => link.requireAuth).map(({ href, label }) => (
                  <Button key={href} variant="ghost" asChild>
                    <Link href={href}>{label}</Link>
                  </Button>
                ))}

                <Button variant="ghost" asChild>
                  <Link href="/profile">Profile</Link>
                </Button>

                <Button onClick={handleLogout} variant="ghost" className="text-red-600 hover:bg-red-50">
                  Log Out
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-2">
              {/* Always show Home link */}
              <Button
                variant="ghost"
                asChild
                className="w-full justify-start"
                onClick={() => setIsMenuOpen(false)}
              >
                <Link href="/">Home</Link>
              </Button>

              {/* Auth/Login Link for non-logged users */}
              {!authState.isLogged ? (
                <Button
                  variant="ghost"
                  asChild
                  className="w-full justify-start"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Link href="/auth">Sign In</Link>
                </Button>
              ) : (
                <>
                  {/* All authenticated links */}
                  {navLinks.filter(link => link.requireAuth).map(({ href, label }) => (
                    <Button
                      key={href}
                      variant="ghost"
                      asChild
                      className="w-full justify-start"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Link href={href}>{label}</Link>
                    </Button>
                  ))}
                  <Button
                    variant="ghost"
                    asChild
                    className="w-full justify-start"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Link href="/profile">Profile</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:bg-red-50"
                    onClick={() => {
                      handleLogout()
                      setIsMenuOpen(false)
                    }}
                  >
                    Log Out
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
