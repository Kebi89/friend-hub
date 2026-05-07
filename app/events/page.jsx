'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, CheckSquare, Clock, MapPin, PartyPopper, Plus, Trash2, Users, Wallet, X } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { createEventChat, requireCurrentUser, saveEventAccess } from '@/lib/auth'

const emptyForm = {
  title: '',
  description: '',
  start_date: '',
  start_time: '',
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
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [eventTasks, setEventTasks] = useState([])
  const [eventCosts, setEventCosts] = useState([])
  const [eventParticipants, setEventParticipants] = useState([])
  const [newTask, setNewTask] = useState('')
  const [newCost, setNewCost] = useState({ description: '', amount: '' })
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

  useEffect(() => {
    if (!isLoaded) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('create') === '1') {
      resetForm()
      setShowCreateForm(true)
      window.history.replaceState(null, '', '/events')
    }
  }, [isLoaded])

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
      const currentUser = await requireCurrentUser()
      if (!currentUser) {
        router.push('/auth')
        return
      }

      setUserId(currentUser.id)

      const eventId = editingEvent?.id || crypto.randomUUID()
      const eventData = {
        id: eventId,
        creator_id: currentUser.id,
        title: formData.title,
        description: formData.description || '',
        event_date: formData.start_date,
        event_time: formData.start_time || null,
        location: formData.location || '',
        is_public: formData.is_public,
      }

      if (formData.end_date) {
        eventData.end_date = formData.end_date
        eventData.is_multi_day = true
      }

      const query = editingEvent
        ? supabase.from('events').update(eventData).eq('id', editingEvent.id).eq('creator_id', currentUser.id)
        : supabase.from('events').insert([eventData])

      const { error } = await query
      if (error) throw error

      const savedEvent = {
        id: eventId,
        title: eventData.title,
      }

      if (!editingEvent) {
        const accessResult = await saveEventAccess(
          savedEvent.id,
          currentUser.id,
          formData.is_public ? [] : formData.access_member_ids
        )

        if (!accessResult.success) {
          alert(`Event created, but access permissions could not be saved: ${accessResult.error}`)
          return
        }
      }

      if (!editingEvent && formData.create_chat) {
        const chatMemberIds = formData.is_public
          ? profiles.map(profile => profile.id)
          : formData.access_member_ids

        const chatResult = await createEventChat(
          savedEvent.id,
          savedEvent.title,
          currentUser.id,
          chatMemberIds
        )

        if (!chatResult.success) {
          alert(`Event created, but the chat could not be created: ${chatResult.error}`)
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

  const openEventDetails = async (event) => {
    setSelectedEvent(event)
    await loadEventDetails(event)
  }

  const loadEventDetails = async (event) => {
    if (!event) return

    const [{ data: tasks }, { data: costs }, { data: participants }] = await Promise.all([
      supabase
        .from('event_tasks')
        .select('*, profiles(id, display_name, nickname)')
        .eq('event_id', event.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('event_costs')
        .select('*, profiles(id, display_name, nickname)')
        .eq('event_id', event.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('event_participants')
        .select('user_id, profiles(id, display_name, nickname)')
        .eq('event_id', event.id),
    ])

    setEventTasks(tasks || [])
    setEventCosts(costs || [])
    setEventParticipants((participants || []).map(participant => ({
      id: participant.user_id,
      displayName: participant.profiles?.display_name || participant.profiles?.nickname || 'Friend',
    })))
  }

  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!selectedEvent || !newTask.trim() || !userId) return

    const { error } = await supabase.from('event_tasks').insert([{
      event_id: selectedEvent.id,
      user_id: userId,
      title: newTask.trim(),
    }])

    if (error) {
      alert('Could not add task: ' + error.message)
      return
    }

    setNewTask('')
    loadEventDetails(selectedEvent)
  }

  const handleToggleTask = async (task) => {
    const { error } = await supabase
      .from('event_tasks')
      .update({ is_done: !task.is_done })
      .eq('id', task.id)

    if (error) {
      alert('Could not update task: ' + error.message)
      return
    }

    loadEventDetails(selectedEvent)
  }

  const handleDeleteTask = async (task) => {
    const { error } = await supabase
      .from('event_tasks')
      .delete()
      .eq('id', task.id)

    if (error) {
      alert('Could not delete task: ' + error.message)
      return
    }

    loadEventDetails(selectedEvent)
  }

  const handleAddCost = async (e) => {
    e.preventDefault()
    if (!selectedEvent || !newCost.description.trim() || !newCost.amount || !userId) return

    const amount = Number.parseFloat(newCost.amount)
    if (!Number.isFinite(amount) || amount < 0) {
      alert('Enter a valid price.')
      return
    }

    const { error } = await supabase.from('event_costs').insert([{
      event_id: selectedEvent.id,
      user_id: userId,
      description: newCost.description.trim(),
      amount,
    }])

    if (error) {
      alert('Could not add cost: ' + error.message)
      return
    }

    setNewCost({ description: '', amount: '' })
    loadEventDetails(selectedEvent)
  }

  const handleDeleteCost = async (cost) => {
    const { error } = await supabase
      .from('event_costs')
      .delete()
      .eq('id', cost.id)

    if (error) {
      alert('Could not delete cost: ' + error.message)
      return
    }

    loadEventDetails(selectedEvent)
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
      start_time: event.event_time || '',
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

  const getDisplayName = (profile) => profile?.display_name || profile?.nickname || 'Friend'

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'EUR',
    }).format(Number(amount || 0))
  }

  const formatTime = (time) => {
    if (!time) return null
    const [hours, minutes] = time.split(':')
    const date = new Date()
    date.setHours(Number(hours || 0), Number(minutes || 0), 0, 0)
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }

  const getMapsUrl = (location) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
  }

  const splitMembers = selectedEvent?.is_public
    ? profiles.map(profile => ({ id: profile.id, displayName: getDisplayName(profile) }))
    : eventParticipants
  const totalCosts = eventCosts.reduce((sum, cost) => sum + Number(cost.amount || 0), 0)
  const splitCount = Math.max(splitMembers.length || 0, 1)
  const splitPerPerson = totalCosts / splitCount

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
                <div
                  key={event.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openEventDetails(event)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') openEventDetails(event)
                  }}
                  className={`cursor-pointer rounded-lg border-l-4 bg-white p-6 shadow-md transition hover:shadow-lg ${isPast ? 'border-gray-400 opacity-75' : 'border-blue-500'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="mb-2 text-xl font-bold text-gray-900">{event.title}</h3>
                      <p className="flex items-center gap-2 text-sm text-gray-600">
                        <CalendarDays className="h-4 w-4" />
                        {startDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      {event.event_time && (
                        <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          {formatTime(event.event_time)}
                        </p>
                      )}
                      {event.description && <p className="mt-2 text-sm text-gray-700">{event.description}</p>}
                      {event.location && (
                        <a
                          href={getMapsUrl(event.location)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                        >
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </a>
                      )}
                    </div>
                    <div className="ml-4 flex flex-col gap-2">
                      {event.creator_id === userId && (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); startEditing(event) }} className="text-sm font-medium text-yellow-600 hover:text-yellow-700">Edit</button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id) }} className="text-sm font-medium text-red-600 hover:text-red-700">Delete</button>
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

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={() => setSelectedEvent(null)}>
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white p-5">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">{selectedEvent.title}</h2>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    {new Date(`${selectedEvent.event_date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  {selectedEvent.event_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatTime(selectedEvent.event_time)}
                    </span>
                  )}
                  {selectedEvent.location && (
                    <a
                      href={getMapsUrl(selectedEvent.location)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                    >
                      <MapPin className="h-4 w-4" />
                      {selectedEvent.location}
                    </a>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close event details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 p-5 lg:grid-cols-[1fr_1fr]">
              <section>
                <div className="mb-4">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                    <CheckSquare className="h-5 w-5 text-blue-600" />
                    Checklist
                  </h3>
                  {selectedEvent.description && <p className="mt-2 text-sm text-slate-600">{selectedEvent.description}</p>}
                </div>

                <form onSubmit={handleAddTask} className="mb-4 flex gap-2">
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Add a task..."
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!newTask.trim()}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Add
                  </button>
                </form>

                <div className="space-y-2">
                  {eventTasks.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">No tasks yet.</p>
                  ) : (
                    eventTasks.map(task => (
                      <div key={task.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <input
                          type="checkbox"
                          checked={!!task.is_done}
                          onChange={() => handleToggleTask(task)}
                          className="h-4 w-4"
                        />
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium ${task.is_done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{task.title}</p>
                          <p className="text-xs text-slate-500">Added by {getDisplayName(task.profiles)}</p>
                        </div>
                        {(task.user_id === userId || selectedEvent.creator_id === userId) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                            aria-label="Delete task"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section>
                <div className="mb-4">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                    <Wallet className="h-5 w-5 text-blue-600" />
                    Costs & Split Bill
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">Track what was bought and split the total across permitted members.</p>
                </div>

                <form onSubmit={handleAddCost} className="mb-4 grid gap-2 sm:grid-cols-[1fr_8rem_auto]">
                  <input
                    type="text"
                    value={newCost.description}
                    onChange={(e) => setNewCost(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="What was bought?"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newCost.amount}
                    onChange={(e) => setNewCost(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Price"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!newCost.description.trim() || !newCost.amount}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Add
                  </button>
                </form>

                <div className="mb-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-100 p-4">
                    <p className="text-xs font-medium uppercase text-slate-500">Total</p>
                    <p className="mt-1 text-2xl font-bold text-slate-950">{formatCurrency(totalCosts)}</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-4">
                    <p className="text-xs font-medium uppercase text-blue-700">Equal split</p>
                    <p className="mt-1 text-2xl font-bold text-blue-950">{formatCurrency(splitPerPerson)}</p>
                    <p className="text-xs text-blue-700">{splitCount} member{splitCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {eventCosts.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">No costs yet.</p>
                  ) : (
                    eventCosts.map(cost => (
                      <div key={cost.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900">{cost.description}</p>
                          <p className="text-xs text-slate-500">Added by {getDisplayName(cost.profiles)}</p>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">{formatCurrency(cost.amount)}</p>
                        {(cost.user_id === userId || selectedEvent.creator_id === userId) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCost(cost)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                            aria-label="Delete cost"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

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
                <label className="mb-1 block text-sm font-medium text-gray-700">Start Time</label>
                <input type="time" value={formData.start_time} onChange={handleInputChange} name="start_time" className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">End Date</label>
                <input type="date" value={formData.end_date} onChange={handleInputChange} name="end_date" className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Location</label>
                <input type="text" value={formData.location} onChange={handleInputChange} name="location" placeholder="Address, venue, or place" className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500" />
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
