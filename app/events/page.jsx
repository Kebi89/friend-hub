'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { getCurrentUserId } from '@/lib/auth'

export default function EventsPage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [userId, setUserId] = useState(null)
  const [events, setEvents] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [showEventDetails, setShowEventDetails] = useState(null)
  
  const [formData, setFormData] = useState({
    title: '', description: '', event_date: '', location: '',
    is_public: true, checklist: [], costs: []
  })

  const [costPerson, setCostPerson] = useState('')
  const [costAmount, setCostAmount] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      if (localStorage.getItem('authenticatedUser') !== 'true') {
        router.push('/auth')
        return
      }
      const userId = await getCurrentUserId()
      setUserId(userId)
      setIsLoaded(true)
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    if (!isLoaded) return
    loadEvents()
    const channel = supabase.channel('events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, loadEvents)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [isLoaded])

  const loadEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*, profiles!creator_id(display_name, nickname)')
      .order('event_date', { ascending: true })
    if (data) setEvents(data)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleCostInputChange = (e) => {
    const { name, value } = e.target
    if (name === 'person') setCostPerson(value)
    else if (name === 'amount') setCostAmount(value)
  }

  const addCost = () => {
    if (costPerson.trim() && costAmount.trim()) {
      setFormData(prev => ({ 
        ...prev, 
        costs: [...prev.costs, { person: costPerson, amount: parseFloat(costAmount) }] 
      }))
      setCostPerson('')
      setCostAmount('')
    }
  }

  const removeCost = (index) => {
    setFormData(prev => ({ ...prev, costs: prev.costs.filter((_, i) => i !== index) }))
  }

  const addChecklistItem = () => {
    setFormData(prev => ({ ...prev, checklist: [...prev.checklist, { text: '', completed: false }] }))
  }
  
  const toggleChecklistItem = (index) => {
    setFormData(prev => ({ 
      ...prev, 
      checklist: prev.checklist.map((item, i) => i === index ? { ...item, completed: !item.completed } : item) 
    }))
  }
  
  const updateChecklistItem = (index, value) => {
    setFormData(prev => ({ 
      ...prev, 
      checklist: prev.checklist.map((item, i) => i === index ? { ...item, text: value } : item) 
    }))
  }
  
  const removeChecklistItem = (index) => {
    setFormData(prev => ({ ...prev, checklist: prev.checklist.filter((_, i) => i !== index) }))
  }

  const handleSaveEvent = async () => {
    if (!formData.title.trim() || !formData.event_date) { 
      alert('Title and date are required!')
      return 
    }

    if (editingEvent) {
      const { error } = await supabase.from('events').update({ ...formData }).eq('id', editingEvent.id)
      if (error) {
        alert(`Update failed: ${error.message}`)
      } else {
        alert('Event updated!')
        loadEvents()
        setShowCreateForm(false)
        setEditingEvent(null)
        resetForm()
      }
    } else {
      const { error } = await supabase.from('events').insert([{ ...formData, creator_id: userId }])
      if (error) {
        alert(`Create failed: ${error.message}`)
      } else {
        alert('Event created!')
        loadEvents()
        setShowCreateForm(false)
        resetForm()
      }
    }
  }

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Delete this event?')) return
    const { error } = await supabase.from('events').delete().eq('id', eventId)
    if (error) {
      alert(`Delete failed: ${error.message}`)
    } else {
      alert('Event deleted!')
      loadEvents()
    }
  }

  const resetForm = () => {
    setFormData({ title: '', description: '', event_date: '', location: '', is_public: true, checklist: [], costs: [] })
    setCostPerson('')
    setCostAmount('')
    setEditingEvent(null)
  }

  const getCostSummary = (costs) => {
    if (!costs || costs.length === 0) return '0.00'
    const total = costs.reduce((sum, cost) => sum + parseFloat(cost.amount), 0)
    return total.toFixed(2)
  }

  if (!isLoaded) {
    return <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-20">Loading events...</div>
      </main>
    </div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">🎉 Events</h1>
          <p className="text-lg text-gray-600">Create, manage and track upcoming events!</p>
        </div>

        <div className="text-center mb-8">
          <button 
            onClick={() => { resetForm(); setShowCreateForm(true); }} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md"
          >
            + Create Event
          </button>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <p className="text-gray-500 text-lg">No events yet!</p>
              <p className="text-gray-400">Create your first event to get started.</p>
            </div>
          ) : events.map(event => {
            const eventDate = new Date(event.event_date)
            const isPast = eventDate < new Date()
            const creator = event.profiles?.display_name || event.profiles?.nickname || 'Anonymous'
            
            return (
              <div key={event.id} className={`bg-white border-l-4 rounded-lg shadow-md p-6 ${isPast ? 'border-gray-400 opacity-75' : 'border-blue-500'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
                      {isPast && <span className="text-xs bg-gray-500 text-white px-2 py-1 rounded">Past Event</span>}
                    </div>
                    {event.description && <p className="text-gray-700 mb-2">{event.description}</p>}
                    <p className="text-sm text-gray-600 mb-3">
                      📅 <span className="font-medium">{eventDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      {event.location && <span className="ml-2">📍 {event.location}</span>}
                    </p>
                    {event.checklist?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-gray-700 mb-1">Checklist:</p>
                        <ul className="text-sm text-gray-600">
                          {event.checklist.map((item, i) => (
                            <li key={i} className={item.completed ? 'line-through text-gray-400' : ''}>
                              {item.text || 'Item'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {event.costs?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-gray-700 mb-1">Cost Overview:</p>
                        <ul className="text-sm text-gray-600">
                          {event.costs.map((cost, i) => (
                            <li key={i}>{cost.person}: ${parseFloat(cost.amount).toFixed(2)}</li>
                          ))}
                        </ul>
                        <p className="text-sm font-semibold text-blue-700 mt-1">
                          Total: ${getCostSummary(event.costs)}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <div className="text-xs text-gray-500">Created by: {creator}</div>
                    <button 
                      onClick={() => setShowEventDetails(event)} 
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Details
                    </button>
                    {event.creator_id === userId && (
                      <>
                        <button 
                          onClick={() => { 
                            setEditingEvent(event)
                            setFormData({ 
                              title: event.title, 
                              description: event.description || '', 
                              event_date: event.event_date, 
                              location: event.location || '', 
                              is_public: event.is_public, 
                              checklist: event.checklist || [], 
                              costs: event.costs || [] 
                            })
                            setShowCreateForm(true)
                          }} 
                          className="text-yellow-600 hover:text-yellow-700 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteEvent(event.id)} 
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {showEventDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowEventDetails(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{showEventDetails.title}</h2>
              <button onClick={() => setShowEventDetails(null)} className="text-2xl text-gray-500 hover:text-gray-700">×</button>
            </div>
            {showEventDetails.description && <p className="text-gray-700 mb-4">{showEventDetails.description}</p>}
            <div className="space-y-2 mb-4">
              <p><strong>Date:</strong> {new Date(showEventDetails.event_date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
              {showEventDetails.location && <p><strong>Location:</strong> {showEventDetails.location}</p>}
              <p><strong>Public:</strong> {showEventDetails.is_public ? 'Yes' : 'No'}</p>
              <p><strong>Created by:</strong> {showEventDetails.profiles?.display_name || showEventDetails.profiles?.nickname || 'Anonymous'}</p>
            </div>
            {showEventDetails.checklist?.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Checklist:</h3>
                <ul className="list-disc list-inside text-gray-700">
                  {showEventDetails.checklist.map((item, i) => (
                    <li key={i} className={item.completed ? 'line-through text-gray-400' : ''}>
                      {item.text || 'Item'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {showEventDetails.costs?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Cost Breakdown:</h3>
                <ul className="text-gray-700">
                  {showEventDetails.costs.map((cost, i) => (
                    <li key={i}>{cost.person}: ${parseFloat(cost.amount).toFixed(2)}</li>
                  ))}
                </ul>
                <p className="font-bold mt-2 text-lg">Total: ${getCostSummary(showEventDetails.costs)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowCreateForm(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
              <button onClick={() => setShowCreateForm(false)} className="text-2xl">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Event title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Event description (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  name="event_date"
                  value={formData.event_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Event location"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_public"
                  id="is_public"
                  checked={formData.is_public}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label htmlFor="is_public" className="text-sm font-medium text-gray-700">Public event (visible to all)</label>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-800">Checklist</h3>
                  <button onClick={addChecklistItem} className="text-blue-600 hover:text-blue-700 text-sm">+ Add Item</button>
                </div>
                <div className="space-y-2">
                  {formData.checklist.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => toggleChecklistItem(index)}
                        className="mr-2"
                      />
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => updateChecklistItem(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Checklist item"
                      />
                      <button onClick={() => removeChecklistItem(index)} className="text-red-600 hover:text-red-700">×</button>
                    </div>
                  ))}
                  {formData.checklist.length === 0 && <p className="text-sm text-gray-500 italic">No checklist items</p>}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-800 mb-2">Cost Overview</h3>
                <div className="space-y-2 mb-2">
                  <input
                    value={costPerson}
                    onChange={handleCostInputChange}
                    name="person"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Person name"
                  />
                  <input
                    value={costAmount}
                    onChange={handleCostInputChange}
                    name="amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Amount ($)"
                    type="number"
                    step="0.01"
                  />
                </div>
                <button onClick={addCost} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm mb-3">
                  + Add Cost
                </button>
                <div>
                  {formData.costs.map((cost, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded mb-1">
                      <span>{cost.person}: ${parseFloat(cost.amount).toFixed(2)}</span>
                      <button onClick={() => removeCost(index)} className="text-red-600 hover:text-red-700">×</button>
                    </div>
                  ))}
                  {formData.costs.length === 0 && <p className="text-sm text-gray-500 italic">No costs added</p>}
                </div>
                {formData.costs.length > 0 && (
                  <p className="font-bold text-blue-700 mt-2">Total: ${getCostSummary(formData.costs)}</p>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveEvent}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
                <button
                  onClick={() => { setShowCreateForm(false); resetForm(); }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">
            © 2026 Friends Hub • {events.length} event{events.length !== 1 ? 's' : ''} • All data in Supabase Cloud
          </p>
        </div>
      </footer>
    </div>
  )
}
