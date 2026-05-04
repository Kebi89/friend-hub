'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [allProfiles, setAllProfiles] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedDates, setSelectedDates] = useState({ start: null, end: null })
  const [isRangeMode, setIsRangeMode] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      return localStorage.getItem('authenticatedUser') === 'true'
    }

    setIsAuthenticated(checkAuth())

    if (!checkAuth()) {
      router.push('/auth')
      return
    }

    setIsLoaded(true)
  }, [router])

  useEffect(() => {
    if (!isLoaded) return

    const loadProfiles = async () => {
      const { data } = await supabase.from('profiles').select('*').not('birthdate', 'is', null)
      if (data) setAllProfiles(data)
    }

    const loadEvents = async () => {
      const { data } = await supabase
        .from('events')
        .select('*, profiles!creator_id(display_name, nickname)')
        .order('event_date', { ascending: true })
      if (data) setEvents(data)
    }

    loadProfiles()
    loadEvents()

    const channel = supabase.channel('calendar')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, loadEvents)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [isLoaded])

  const getBirthdaysForMonth = (date) => {
    const month = date.getMonth()
    const year = date.getFullYear()
    return allProfiles
      .filter(profile => {
        const birthdate = new Date(profile.birthdate)
        return birthdate.getMonth() === month
      })
      .map(profile => {
        const birthdate = new Date(profile.birthdate)
        const age = year - birthdate.getFullYear()
        return { ...profile, day: birthdate.getDate(), age: age <= 0 ? 'Baby' : age }
      })
  }

  const getEventsForDay = (day) => {
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    return events.filter(event => {
      const eventDate = new Date(event.event_date)
      return eventDate.getDate() === day &&
             eventDate.getMonth() === checkDate.getMonth() &&
             eventDate.getFullYear() === checkDate.getFullYear()
    })
  }

  const getBirthdaysForDay = (day) => {
    return getBirthdaysForMonth(currentDate).filter(birthday => birthday.day === day)
  }

  const getMonthName = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))

  const getCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []

    for (let i = 0; i < firstDay; days.push(null), i++);
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    return days
  }

  const calendarDays = getCalendarDays()
  const monthBirthdays = getBirthdaysForMonth(currentDate)
  const eventsThisMonth = events.filter(e => {
    const eventDate = new Date(e.event_date)
    return eventDate.getMonth() === currentDate.getMonth() &&
           eventDate.getFullYear() === currentDate.getFullYear()
  })

  const handleDayClick = (day) => {
    if (!day) return

    const newStartDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)

    if (!isRangeMode) {
      // Start selection
      setIsRangeMode(true)
      setSelectedDates({ start: newStartDate, end: newStartDate })
      setSelectedDate(newStartDate)
    } else if (selectedDates.start && newStartDate >= selectedDates.start) {
      // End selection or reset if same day
      if (newStartDate.getTime() === selectedDates.start.getTime()) {
        // Create single-day event
        setIsRangeMode(false)
        setSelectedDates({ start: null, end: null })
        // Open create modal with single date
        openCreateModal(newStartDate)
      } else {
        // Complete range selection
        setIsRangeMode(false)
        setSelectedDates({ start: selectedDates.start, end: newStartDate })
        openCreateModal(selectedDates.start, newStartDate)
      }
    } else {
      // Reset to new start
      setSelectedDates({ start: newStartDate, end: newStartDate })
      setSelectedDate(newStartDate)
    }
  }

  const openCreateModal = (startDate = selectedDates.start, endDate = selectedDates.end) => {
    setShowCreateModal(true)
    setModalEventData({
      title: '',
      description: '',
      startDate: startDate ? formatDate(startDate) : '',
      endDate: endDate ? formatDate(endDate) : (startDate ? formatDate(startDate) : ''),
      location: '',
      is_multi_day: endDate ? true : false,
    })
  }

  const formatDate = (date) => {
    return date.toISOString().split('T')[0]
  }

  const handleCreateEvent = async (eventData) => {
    try {
      const startDate = new Date(eventData.startDate)
      const endDate = eventData.is_multi_day ? new Date(eventData.endDate) : null

      await supabase.from('events').insert([{
        creator_id: eventData.creator_id,
        title: eventData.title,
        description: eventData.description || '',
        event_date: eventData.startDate,
        end_date: eventData.is_multi_day ? eventData.endDate : null,
        is_multi_day: eventData.is_multi_day || false,
        location: eventData.location || '',
        checklist: eventData.checklist || [],
        costs: eventData.costs || [],
      }])

      setShowCreateModal(false)
      // Reload events
      const { data } = await supabase
        .from('events')
        .select('*, profiles!creator_id(display_name, nickname)')
        .order('event_date', { ascending: true })
      if (data) setEvents(data)
    } catch (error) {
      console.error('Error creating event:', error)
    }
  }

  if (!isLoaded) {
    return <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white"><Navbar /><main className="container mx-auto px-4 py-8"><div className="text-center py-20">Loading calendar...</div></main></div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">📅 Calendar</h1>
          <p className="text-lg text-gray-600">Track birthdays and plan events!</p>
          <Link href="/events" className="mt-4 inline-block">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
              Plan New Event →
            </Button>
          </Link>
        </div>

        {/* Calendar Controls */}
        <div className="flex justify-between items-center mb-6 max-w-4xl mx-auto">
          <button onClick={prevMonth} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">← Previous</button>
          <h2 className="text-2xl font-bold text-gray-800">{getMonthName(currentDate)}</h2>
          <button onClick={nextMonth} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Next →</button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-xl shadow-md p-6 max-w-6xl mx-auto">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-gray-700 py-2">{day}</div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              if (!day) return <div key={`empty-${index}`} className="aspect-square"></div>

              const dayBirthdays = getBirthdaysForDay(day)
              const dayEvents = getEventsForDay(day)

              const isToday = day === new Date().getDate() &&
                             currentDate.getMonth() === new Date().getMonth() &&
                             currentDate.getFullYear() === new Date().getFullYear()

              const isSelectedStart = selectedDates.start &&
                selectedDates.start.getDate() === day &&
                selectedDates.start.getMonth() === currentDate.getMonth()

              const isSelectedEnd = selectedDates.end &&
                selectedDates.end.getDate() === day &&
                selectedDates.end.getMonth() === currentDate.getMonth()

              const isSelectedRange = isSelectedStart || isSelectedEnd ||
                (selectedDates.start && selectedDates.end &&
                  new Date(currentDate.getFullYear(), currentDate.getMonth(), day) >= selectedDates.start &&
                  new Date(currentDate.getFullYear(), currentDate.getMonth(), day) <= selectedDates.end)

              return (
                <div
                  key={day}
                  className={`aspect-square border rounded-lg p-2 relative hover:shadow-md transition-shadow cursor-pointer
                    ${isSelectedStart ? 'bg-blue-500 border-blue-500 text-white' :
                      isSelectedEnd ? 'bg-blue-500 border-blue-500 text-white' :
                      isSelectedRange ? 'bg-blue-100 border-blue-300' :
                      isToday ? 'bg-blue-50 border-blue-500' : 'bg-white'}`}
                  onClick={() => handleDayClick(day)}
                >
                  <div className={`font-semibold ${isSelectedStart || isSelectedEnd ? 'text-white' : 'text-gray-900'}`}>
                    {day}
                  </div>

                  {/* Multiple Birthdays */}
                  {dayBirthdays.length > 0 && (
                    <div className={`mt-1 text-xs truncate ${isSelectedStart || isSelectedEnd ? 'text-white' : 'text-red-500'}`}>
                      {dayBirthdays.length > 1 ? `${dayBirthdays.length} birthdays` : dayBirthdays[0].display_name}
                    </div>
                  )}

                  {/* Multiple Events */}
                  {dayEvents.length > 0 && (
                    <div className={`mt-1 text-xs truncate ${isSelectedStart || isSelectedEnd ? 'text-white' : 'text-blue-500'}`}>
                      {dayEvents.length > 1 ? `${dayEvents.length} events` : dayEvents[0].title}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Create Event Modal */}
        {showCreateModal && (
          <CreateEventModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateEvent}
            defaultStartDate={selectedDates.start}
            defaultEndDate={selectedDates.end}
          />
        )}

        {/* Month Stats */}
        {monthBirthdays.length > 0 && (
          <div className="max-w-4xl mx-auto mt-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">🎉 Birthdays This Month</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {monthBirthdays.map(birthday => {
                const birthdayDate = new Date(birthday.birthdate)
                return (
                  <div key={birthday.id} className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{birthday.display_name}</p>
                        <p className="text-sm text-gray-600">{birthdayDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</p>
                      </div>
                      <div className="text-3xl">🎂</div>
                    </div>
                    {birthday.nickname && <p className="text-xs text-gray-500 mt-1">Nickname: {birthday.nickname}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {eventsThisMonth.length > 0 && (
          <div className="max-w-4xl mx-auto mt-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">📅 This Month's Events</h3>
            <div className="grid grid-cols-1 gap-4">
              {eventsThisMonth.map(event => {
                const eventDate = new Date(event.event_date)
                return (
                  <div key={event.id} className="bg-white border-l-4 border-blue-500 rounded-lg shadow-md p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{event.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{eventDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        {event.description && <p className="text-sm text-gray-700 mt-2">{event.description}</p>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// Create Event Modal Component
function CreateEventModal({ onClose, onCreate, defaultStartDate, defaultEndDate }) {
  const [formData, setFormData] = useState({
    creator_id: localStorage.getItem('authenticatedUser') ? 'self' : null,
    title: '',
    description: '',
    startDate: defaultStartDate ? formatDate(defaultStartDate) : '',
    endDate: defaultEndDate ? formatDate(defaultEndDate) : '',
    location: '',
    is_multi_day: defaultEndDate ? true : false,
  })

  const formatDate = (date) => {
    return date.toISOString().split('T')[0]
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (name === 'is_multi_day' && !checked) {
      setFormData(prev => ({ ...prev, endDate: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const userToken = localStorage.getItem('currentUserToken')
    if (!userToken) {
      alert('Please log in first')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await onCreate({ ...formData, creator_id: user.id })
        onClose()
      } else {
        alert('Please log in')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error creating event')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Create New Event</h2>
          <button onClick={onClose} className="text-2xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                name="is_multi_day"
                id="is_multi_day"
                checked={formData.is_multi_day}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label htmlFor="is_multi_day" className="text-sm font-medium text-gray-700">Multi-day event?</label>
            </div>
            {formData.is_multi_day && (
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min={formData.startDate}
                required
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg">
              Create Event
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
