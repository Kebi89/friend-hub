'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarDays, MessageCircle, Plus, Send, Trash2 } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import {
  HUB_CHAT_ID,
  deleteMessage,
  getMessagesForChat,
  getUserProfile,
  getVisibleChats,
  requireCurrentUser,
  saveMessage,
} from '@/lib/auth'

export default function MessagesPage() {
  const [messages, setMessages] = useState([])
  const [chats, setChats] = useState([])
  const [activeTab, setActiveTab] = useState('hub')
  const [selectedChatId, setSelectedChatId] = useState(HUB_CHAT_ID)
  const [newMessage, setNewMessage] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  const [username, setUsername] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [userId, setUserId] = useState(null)
  const router = useRouter()
  const fallbackHubChat = {
    id: HUB_CHAT_ID,
    title: 'Hub',
    type: 'hub',
    eventDate: null,
    endDate: null,
  }

  const hubChats = chats.filter((chat) => chat.type === 'hub')
  const eventChats = chats.filter((chat) => chat.type === 'event')
  const visibleChats = activeTab === 'events' ? eventChats : hubChats
  const selectedChat = activeTab === 'hub'
    ? visibleChats.find((chat) => chat.id === selectedChatId) || fallbackHubChat
    : visibleChats.find((chat) => chat.id === selectedChatId) || null
  const isGroupDirectory = activeTab !== 'hub' && !selectedChatId

  const loadChats = useCallback(async (currentUserId) => {
    const visible = await getVisibleChats(currentUserId)
    setChats(visible)

    const hasSelected = visible.some((chat) => chat.id === selectedChatId)
    if (!hasSelected) {
      if (activeTab === 'hub') {
        const nextChat = visible.find((chat) => chat.type === 'hub')
        setSelectedChatId(nextChat?.id || HUB_CHAT_ID)
      } else {
        setSelectedChatId(null)
      }
    }
  }, [activeTab, selectedChatId])

  const loadMessages = useCallback(async (chatId = selectedChatId) => {
    if (!chatId) return
    const msgs = await getMessagesForChat(chatId)
    setMessages(msgs)
  }, [selectedChatId])

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

      await loadChats(currentUser.id)
      setCheckingAuth(false)
      setIsLoaded(true)
    }

    checkAuth()
  }, [loadChats, router])

  useEffect(() => {
    if (!isLoaded || !userId) return

    if (!selectedChatId) {
      setMessages([])
      return
    }

    loadMessages(selectedChatId)

    const messagesChannel = supabase
      .channel(`messages-${selectedChatId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${selectedChatId}`,
      }, () => loadMessages(selectedChatId))
      .subscribe()

    const chatsChannel = supabase
      .channel(`chats-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chats',
      }, () => loadChats(userId))
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_members',
      }, () => loadChats(userId))
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(chatsChannel)
    }
  }, [isLoaded, loadChats, loadMessages, selectedChatId, userId])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    const nextChat = chats.find((chat) => tab === 'hub' && chat.type === 'hub')
    setSelectedChatId(tab === 'hub' ? nextChat?.id || HUB_CHAT_ID : null)
    setNewMessage('')
    setMessages([])
  }

  const handleChatSelect = (chatId) => {
    setSelectedChatId(chatId)
    setNewMessage('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!newMessage.trim() || !userId || !selectedChatId) {
      return
    }

    const result = await saveMessage(userId, newMessage.trim(), selectedChatId)

    if (result) {
      setNewMessage('')
      loadMessages(selectedChatId)
    } else {
      alert('Failed to send message')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this message?')) {
      const success = await deleteMessage(id)
      if (success) loadMessages(selectedChatId)
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

  const formatEventDate = (chat) => {
    if (!chat?.eventDate) return 'Event chat'
    const start = new Date(`${chat.eventDate}T00:00:00`)
    return start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
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

      <main className="mx-auto flex h-[calc(100vh-4rem)] max-w-6xl flex-col px-3 py-4 sm:px-6">
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold text-slate-950 sm:text-2xl">Friends Chat</h1>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedChat?.title || 'Hub'} chat - Signed in as {username || 'Friend'}
                </p>
              </div>
              <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white sm:flex">
                {getInitials(username)}
              </div>
            </div>

            <div className="mt-4 flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => handleTabChange('hub')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                  activeTab === 'hub' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageCircle className="h-4 w-4" />
                Hub
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('events')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                  activeTab === 'events' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="h-4 w-4" />
                Events
              </button>
            </div>

            {visibleChats.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {activeTab !== 'hub' && selectedChatId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedChatId(null)
                      setMessages([])
                      setNewMessage('')
                    }}
                    className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-300"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Groups
                  </button>
                )}
                {visibleChats.map((chat) => (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => handleChatSelect(chat.id)}
                    className={`shrink-0 rounded-lg border px-3 py-2 text-left text-sm transition ${
                      selectedChatId === chat.id
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="block max-w-48 truncate font-medium">{chat.title}</span>
                    <span className="block text-xs text-slate-500">
                      {chat.type === 'event' ? formatEventDate(chat) : 'Pinned main chat'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-3 py-5 sm:px-6">
            {isGroupDirectory && eventChats.length > 0 ? (
              <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2">
                {eventChats.map((chat) => (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => handleChatSelect(chat.id)}
                    className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    <span className="block font-semibold text-slate-900">{chat.title}</span>
                    <span className="mt-1 block text-sm text-slate-500">{formatEventDate(chat)}</span>
                  </button>
                ))}
              </div>
            ) : activeTab === 'events' && eventChats.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                    <CalendarDays className="h-7 w-7 text-slate-500" />
                  </div>
                  <p className="text-lg font-semibold text-slate-900">No active event chats</p>
                  <p className="mt-1 text-sm text-slate-500">Create one from an event and invite only the people who need it.</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                    <MessageCircle className="h-7 w-7 text-slate-500" />
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

          {isGroupDirectory ? (
            <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
              <button
                type="button"
                onClick={() => router.push('/events')}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Plus className="h-5 w-5" />
                Create Group
              </button>
            </div>
          ) : (
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
                  placeholder={selectedChat ? `Message ${selectedChat.title}...` : 'Message your friends...'}
                  rows="1"
                  className="max-h-32 min-h-11 w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                  disabled={!userId || !selectedChatId}
                />
              </div>
              <button
                type="submit"
                disabled={!userId || !selectedChatId || !newMessage.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </form>
          )}
        </section>
      </main>
    </div>
  )
}
