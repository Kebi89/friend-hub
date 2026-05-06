'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Trash2 } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { getAllMessages, saveMessage, deleteMessage, requireCurrentUser } from '@/lib/auth'

export default function MessagesPage() {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  const [username, setUsername] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [userId, setUserId] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await requireCurrentUser()
      if (!currentUser) {
        setCheckingAuth(false)
        router.push('/auth')
        return
      }

      setUserId(currentUser.id)

      const userProfile = await getUserProfile(currentUser.id)
      if (userProfile) {
        setUsername(userProfile.display_name || userProfile.nickname || 'Anonymous')
      }

      setCheckingAuth(false)
      setIsLoaded(true)
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    if (!isLoaded || !userId) return

    loadMessages()

    const messagesChannel = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
      }, loadMessages)
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
    }
  }, [isLoaded, userId])

  const loadMessages = async () => {
    const msgs = await getAllMessages()
    setMessages(msgs)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!newMessage.trim() || !userId) {
      return
    }

    const result = await saveMessage(userId, newMessage.trim())

    if (result) {
      setNewMessage('')
      const msgs = await getAllMessages()
      setMessages(msgs)
    } else {
      alert('Failed to send message')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this message?')) {
      const success = await deleteMessage(id)
      if (success) {
        const msgs = await getAllMessages()
        setMessages(msgs)
      }
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

  const getInitials = (name) => {
    if (!name || name === 'Anonymous') return '?'
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  async function getUserProfile(uId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uId)
      .single()

    if (error) return null
    return data
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="animate-pulse text-lg text-slate-500">Loading chat...</div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="mx-auto flex h-[calc(100vh-4rem)] max-w-5xl flex-col px-3 py-4 sm:px-6">
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
            <div>
              <h1 className="text-xl font-semibold text-slate-950 sm:text-2xl">Friends Chat</h1>
              <p className="mt-1 text-sm text-slate-500">
                {messages.length} message{messages.length !== 1 ? 's' : ''} · Signed in as {username || 'Friend'}
              </p>
            </div>
            <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white sm:flex">
              {getInitials(username)}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-3 py-5 sm:px-6">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
                    💬
                  </div>
                  <p className="text-lg font-semibold text-slate-900">No messages yet</p>
                  <p className="mt-1 text-sm text-slate-500">Start the conversation with your friends.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col-reverse gap-4">
                {messages.map((msg) => {
                  const senderName = msg.user === 'Anonymous' ? 'Anonymous Friend' : msg.user
                  const isMine = senderName === username

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isMine && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">
                          {getInitials(senderName)}
                        </div>
                      )}

                      <div className={`group max-w-[78%] sm:max-w-[68%] ${isMine ? 'items-end' : 'items-start'}`}>
                        <div className={`mb-1 flex items-center gap-2 text-xs ${isMine ? 'justify-end text-slate-500' : 'text-slate-500'}`}>
                          <span className="font-medium">{senderName}</span>
                          <span>{formatTime(msg.timestamp)}</span>
                        </div>
                        <div
                          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                            isMine
                              ? 'rounded-br-md bg-blue-600 text-white'
                              : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                        </div>
                        <div className={`mt-1 flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 focus:opacity-100"
                            title="Delete message"
                            aria-label="Delete message"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {isMine && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                          {getInitials(username)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-3 sm:p-4">
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <label htmlFor="message" className="sr-only">Message</label>
                <textarea
                  id="message"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      e.currentTarget.form?.requestSubmit()
                    }
                  }}
                  placeholder="Message your friends..."
                  rows="1"
                  className="max-h-32 min-h-11 w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                  disabled={!userId}
                />
              </div>
              <button
                type="submit"
                disabled={!userId || !newMessage.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}
