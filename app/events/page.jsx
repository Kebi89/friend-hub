'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, MapPin, PartyPopper, Plus, Users } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { createEventChat, requireCurrentUser, saveEventAccess } from '@/lib/auth'

const emptyForm = {
  title: '',
  description: '',
  start_date: '',
  end_date: '',
  location: '',
  is_public: true,
  is_multi_day: false,
  costs: [],
  create_chat: false,
  access_member_ids: [],
}

export default function EventsPage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [userId, setUserId] = useState(null)
  const [events, setEvents] = useState([])
  const [profiles, setProfiles] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [formData, setFormData] = useState(emptyForm)

  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await requireCurrentUser()
      if (!currentUser) {
        router.push('/auth')
        return
      }
      setUserId(currentUser.id)
      setIsLoaded(true)
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    if (!isLoaded || !userId) return
    loadEvents()
    loadProfiles()
  }, [isLoaded, userId])

  const loadEvents = async () => {
    try {
      const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true })
      if (data) setEvents(data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const loadProfiles = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, nickname, email')
        .order('display_name', { ascending: true })

      if (data) setProfiles(data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSaveEvent = async () => {
    if (!formData.title.trim() || !formData.start_date) {
      alert('Title and start date are required!')
      return
    }

    try {
      const eventData = {
        creator_id: userId,
        title: formData.title,
        description: formData.description || '',
        event_date: formData.start_date,
        location: formData.location || '',
        is_public: formData.is_public,
      }

      if (formData.end_date) {
        eventData.end_date = formData.end_date
        eventData.is_multi_day = true
      }

      const query = editingEvent
        ? supabase.from('events').update(eventData).eq('id', editingEvent.id).eq('creator_id', userId).select().single()
        : supabase.from('events').insert([eventData]).select().single()

      const { data: savedEvent, error } = await query
      if (error) throw error

      if (!editingEvent && savedEvent) {
        const accessSaved = await saveEventAccess(
          savedEvent.id,
          userId,
          formData.is_public ? [] : formData.access_member_ids
        )

        if (!accessSaved) {
          alert('Event created, but access permissions could not be saved.')
        }
      }

      if (!editingEvent && formData.create_chat && savedEvent) {
        const chatMemberIds = formData.is_public
          ? profiles.map(profile => profile.id)
          : formData.access_member_ids

        const chat = await createEventChat(
          savedEvent.id,
          savedEvent.title,
          userId,
          chatMemberIds
        )

        if (!chat) {
          alert('Event created, but the chat could not be created.')
        }
      }

      loadEvents()
      setShowCreateForm(false)
      resetForm()
      alert(editingEvent ? 'Event updated!' : 'Event created!')
    } catch (error) {
      alert('Save failed: ' + error.message)
    }
  }

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Delete this event?')) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !user.id) {
        alert('Please log in')
        return
      }
      const event = events.find(e => e.id === eventId)
      if (!event || event.creator_id !== user.id) {
        alert('You can only delete your own events')
        return
      }
      const { error } = await supabase.from('events').delete().eq('id', eventId).eq('creator_id', user.id)
      if (error) {
        alert('Delete failed: ' + error.message)
      } else {
        alert('Event deleted!')
        loadEvents()
      }
    } catch (error) {
      alert('Failed to delete')
    }
  }

  const resetForm = () => {
    setFormData(emptyForm)
    setEditingEvent(null)
  }

  const closeForm = () => {
    setShowCreateForm(false)
    resetForm()
  }

  const toggleAccessMember = (memberId) => {
    setFormData(prev => ({
      ...prev,
      access_member_ids: prev.access_member_ids.includes(memberId)
        ? prev.access_member_ids.filter(id => id !== memberId)
        : [...prev.access_member_ids, memberId],
    }))
  }

  const startEditing = (event) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      description: event.description || '',
      start_date: event.event_date,
      end_date: event.end_date || '',
      location: event.location || '',
      is_public: event.is_public,
      is_multi_day: !!event.end_date,
      costs: event.costs || [],
      create_chat: false,
      access_member_ids: [],
    })
    setShowCreateForm(true)
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-20">Loading...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-12 text-center">
          <h1 className="mb-4 flex items-center justify-center gap-3 text-4xl font-bold text-gray-800">
            <PartyPopper className="h-9 w-9 text-blue-600" />
            Events
          </h1>
          <p className="text-lg text-gray-600">Plan and manage your trips!</p>
        </div>

        <div className="mb-8 text-center">
          <button
            onClick={() => {
              resetForm()
              setShowCreateForm(true)
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white shadow-md hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            Create Event
          </button>
        </div>

        <div className="mx-auto max-w-4xl space-y-4">
          {events.length === 0 ? (
            <div className="rounded-lg bg-white p-6 text-center shadow-md">
              <p className="text-gray-500">No events yet</p>
            </div>
          ) : (
            events.map(event => {
              const startDate = new Date(`${event.event_date}T00:00:00`)
              const isPast = startDate < new Date().setHours(0, 0, 0, 0)

              return (
                <div key={event.id} className={`rounded-lg border-l-4 bg-white p-6 shadow-md ${isPast ? 'border-gray-400 opacity-75' : 'border-blue-500'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="mb-2 text-xl font-bold text-gray-900">{event.title}</h3>
                      <p className="flex items-center gap-2 text-sm text-gray-600">
                        <CalendarDays className="h-4 w-4" />
                        {startDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      {event.description && <p className="mt-2 text-sm text-gray-700">{event.description}</p>}
                      {event.location && (
                        <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </p>
                      )}
                    </div>
                    <div className="ml-4 flex flex-col gap-2">
                      {event.creator_id === userId && (
                        <>
                          <button onClick={() => startEditing(event)} className="text-sm font-medium text-yellow-600 hover:text-yellow-700">Edit</button>
                          <button onClick={() => handleDeleteEvent(event.id)} className="text-sm font-medium text-red-600 hover:text-red-700">Delete</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>

      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={closeForm}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">{editingEvent ? 'Edit Event' : 'Create Event'}</h2>
              <button onClick={closeForm} className="text-2xl">x</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Title *</label>
                <input type="text" value={formData.title} onChange={handleInputChange} name="title" className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea value={formData.description} onChange={handleInputChange} name="description" className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500" rows="3" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Start Date *</label>
                <input type="date" value={formData.start_date} onChange={handleInputChange} name="start_date" className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">End Date</label>
                <input type="date" value={formData.end_date} onChange={handleInputChange} name="end_date" className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="multi_day" checked={formData.is_multi_day} onChange={(e) => setFormData(prev => ({ ...prev, is_multi_day: e.target.checked, end_date: e.target.checked ? prev.end_date || prev.start_date : '' }))} className="mr-2" />
                <label htmlFor="multi_day" className="text-sm">Multi-day event</label>
              </div>

              {!editingEvent && (
                <>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
                      <input
                        type="checkbox"
                        checked={formData.is_public}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked, access_member_ids: e.target.checked ? [] : prev.access_member_ids }))}
                      />
                      Visible to everyone in the Hub
                    </label>
                    <p className="mt-1 text-xs text-gray-500">
                      Turn this off for private events. Only selected members will see the event and anything connected to it.
                    </p>

                    {!formData.is_public && (
                      <div className="mt-4">
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
                          <Users className="h-4 w-4" />
                          Event access
                        </div>
                        <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
                          {profiles.filter(profile => profile.id !== userId).length === 0 ? (
                            <p className="px-2 py-3 text-sm text-gray-500">No other profiles found yet.</p>
                          ) : (
                            profiles.filter(profile => profile.id !== userId).map(profile => {
                              const label = profile.display_name || profile.nickname || profile.email || 'Friend'
                              return (
                                <label key={profile.id} className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-slate-50">
                                  <input
                                    type="checkbox"
                                    checked={formData.access_member_ids.includes(profile.id)}
                                    onChange={() => toggleAccessMember(profile.id)}
                                  />
                                  <span className="min-w-0 flex-1 truncate">{label}</span>
                                </label>
                              )
                            })
                          )}
                        </div>
                        <p className="mt-2 text-xs text-gray-500">You are included automatically.</p>
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
                      <input
                        type="checkbox"
                        checked={formData.create_chat}
                        onChange={(e) => setFormData(prev => ({ ...prev, create_chat: e.target.checked }))}
                      />
                      Create a dedicated event chat
                    </label>
                    <p className="mt-1 text-xs text-gray-500">
                      The chat uses the same event access list and disappears after the event date has passed.
                    </p>
                  </div>
                </>
              )}
              <div className="mt-6 flex gap-3">
                <button onClick={handleSaveEvent} className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">Save</button>
                <button onClick={closeForm} className="flex-1 rounded-lg bg-gray-600 px-4 py-2 font-semibold text-white hover:bg-gray-700">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
