'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'

export default function EventsPage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [userId, setUserId] = useState(null)
  const [events, setEvents] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [formData, setFormData] = useState({
    title: '', description: '', start_date: '', end_date: '', location: '',
    is_public: true, is_multi_day: false, costs: []
  })

  const [costPerson, setCostPerson] = useState('')
  const [costAmount, setCostAmount] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = localStorage.getItem('authenticatedUser')
      if (authStatus !== 'true') {
        router.push('/auth')
        return
      }
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUserId(user?.id || null)
        setIsLoaded(true)
      } catch (error) {
        router.push('/auth')
      }
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    if (!isLoaded || !userId) return
    loadEvents()
  }, [isLoaded, userId])

  const loadEvents = async () => {
    try {
      const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true })
      if (data) setEvents(data)
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
      const { error } = await supabase.from('events').insert([eventData])
      if (error) throw error
      loadEvents()
      setShowCreateForm(false)
      resetForm()
      alert('Event created!')
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

  const getCostSummary = (costs) => {
    if (!costs || costs.length === 0) return '0.00'
    const total = costs.reduce((sum, cost) => sum + parseFloat(cost.amount), 0)
    return total.toFixed(2)
  }

  const resetForm = () => {
    setFormData({ title: '', description: '', start_date: '', end_date: '', location: '', is_public: true, is_multi_day: false, costs: [] })
    setCostPerson('')
    setCostAmount('')
    setEditingEvent(null)
  }

  if (!isLoaded) return <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white"><Navbar /><main className="container mx-auto px-4 py-8"><div className="text-center py-20">Loading...</div></main></div>

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">🎉 Events</h1>
          <p className="text-lg text-gray-600">Plan and manage your trips!</p>
        </div>

        <div className="text-center mb-8">
          <button onClick={() => setShowCreateForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md">+ Create Event</button>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {events.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-500">No events yet</p>
            </div>
          ) : (
            events.map(event => {
              const startDate = new Date(event.event_date)
              const isPast = startDate < new Date().setHours(0,0,0,0)

              return (
                <div key={event.id} className={`bg-white border-l-4 rounded-lg shadow-md p-6 ${isPast ? 'border-gray-400 opacity-75' : 'border-blue-500'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                      <p className="text-sm text-gray-600">📅 {startDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                      {event.description && <p className="text-sm text-gray-700 mt-2">{event.description}</p>}
                      {event.location && <p className="text-sm text-gray-600 mt-1">📍 {event.location}</p>}
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      {event.creator_id === userId && (
                        <>
                          <button onClick={() => { setEditingEvent(event); setFormData({ title: event.title, description: event.description || '', start_date: event.event_date, end_date: event.end_date || '', location: event.location || '', is_public: event.is_public, is_multi_day: !!event.end_date, costs: event.costs || [] }); setShowCreateForm(true); }} className="text-yellow-600 hover:text-yellow-700 text-sm font-medium">Edit</button>
                          <button onClick={() => handleDeleteEvent(event.id)} className="text-red-600 hover:text-red-700 text-sm font-medium">Delete</button>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowCreateForm(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{editingEvent ? 'Edit Event' : 'Create Event'}</h2>
              <button onClick={() => setShowCreateForm(false)} className="text-2xl">x</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" value={formData.title} onChange={handleInputChange} name="title" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={formData.description} onChange={handleInputChange} name="description" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" rows="3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <input type="date" value={formData.start_date} onChange={handleInputChange} name="start_date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input type="date" value={formData.end_date} onChange={handleInputChange} name="end_date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="multi_day" checked={formData.is_multi_day} onChange={(e) => setFormData(prev => ({ ...prev, is_multi_day: e.target.checked, end_date: e.target.checked ? prev.end_date || prev.start_date : '' }))} className="mr-2" />
                <label htmlFor="multi_day" className="text-sm">Multi-day event</label>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleSaveEvent} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg">Save</button>
                <button onClick={() => { setShowCreateForm(false); resetForm(); }} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
