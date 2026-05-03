'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { isUserLoggedIn } from '@/lib/auth'

export default function MessagesPage() {
  const [messages, setMessages] = useState([])
  const [username, setUsername] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const router = useRouter()

  // Check authentication
  useEffect(() => {
    const isLogged = isUserLoggedIn()
    if (!isLogged) {
      setCheckingAuth(false)
      router.push('/auth')
      return
    }
    setIsLoaded(true)
    setCheckingAuth(false)
  }, [router])

  useEffect(() => {
    // Load messages from localStorage on mount
    const storedMessages = localStorage.getItem('hubMessages')
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages))
    }
    setIsLoaded(true)
  }, [])

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('hubMessages', JSON.stringify(messages))
    }
  }, [messages, isLoaded])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!newMessage.trim()) {
      alert('Please enter a message!')
      return
    }

    const message = {
      id: Date.now(),
      user: username.trim() || 'Anonymous',
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
    }

    // Add new message to the top
    setMessages([message, ...messages])

    // Clear the input
    setNewMessage('')

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = (id) => {
    if (window.confirm('Delete this message?')) {
      setMessages(messages.filter((msg) => msg.id !== id))
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="animate-pulse text-lg text-gray-500">Loading messages...</div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">💬 Message Board</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Share your favorite memories, thoughts, and messages with your friends!
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Message Form */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Post a Message</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your name (optional)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Message
                </label>
                <textarea
                  id="message"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Write something amazing..."
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                Post Message
              </button>
            </form>
          </div>

          {/* Messages List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Recent Messages <span className="text-sm text-gray-500">({messages.length})</span>
              </h2>
              {messages.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('Clear all messages?')) {
                      setMessages([])
                      localStorage.removeItem('hubMessages')
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-500 text-lg font-medium">No messages yet!</p>
                <p className="text-gray-400">Be the first to share something awesome!</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50 rounded-r-lg hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span className="font-semibold text-gray-900">
                          {msg.user === 'Anonymous' ? 'Anonymous Friend' : msg.user}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                          {formatTime(msg.timestamp)}
                        </span>
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
                          title="Delete message"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3">Current User</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex justify-between">
                <span>Name:</span>
                <span className="font-semibold">{username.trim() || 'Not set (set in profile)'}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-semibold text-green-600">✓ Logged in</span>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-8 bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Tips:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your name will be saved for your next message</li>
              <li>• Messages persist in your browser (LocalStorage)</li>
              <li>• Feel free to share memories, jokes, or thoughts</li>
              <li>• All data stored locally - never leaves your device!</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
