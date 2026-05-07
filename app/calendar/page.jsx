'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Cake, CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { EmptyState, PageHeader, PageShell, SectionCard } from '@/components/ui/page-shell'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { requireCurrentUser } from '@/lib/auth'

function formatDateInput(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [allProfiles, setAllProfiles] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedDates, setSelectedDates] = useState({ start: null, end: null })
  const [modalDates, setModalDates] = useState({ start: null, end: null })
  const [isRangeMode, setIsRangeMode] = useState(false)
  const [userId, setUserId] = useState(null)
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
    }
  }

  const openCreateModal = (startDate = selectedDates.start, endDate = selectedDates.end) => {
    setShowCreateModal(true)
    setModalDates({ start: startDate, end: endDate || null })
  }

  const formatDate = (date) => {
    return formatDateInput(date)
  }

  const handleCreateEvent = async (eventData) => {
    try {
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
    return <PageShell><div className="py-20 text-center text-muted-foreground">Loading calendar...</div></PageShell>
  }

  return (
    <PageShell>
        <PageHeader
          icon={CalendarDays}
          title="Calendar"
          description="Track birthdays, scan upcoming events, and start planning from a date."
          actions={
          <Link href="/events">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Plan New Event
            </Button>
          </Link>
          }
        />

        {/* Calendar Controls */}
        <div className="mx-auto mb-6 flex max-w-4xl items-center justify-between gap-3">
          <button onClick={prevMonth} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground hover:border-primary/40">
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <h2 className="text-center text-xl font-bold text-foreground sm:text-2xl">{getMonthName(currentDate)}</h2>
          <button onClick={nextMonth} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground hover:border-primary/40">
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Calendar Grid */}
        <SectionCard className="mx-auto max-w-6xl">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-2 text-center text-sm font-semibold text-muted-foreground">{day}</div>
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
                  className={`relative aspect-square cursor-pointer rounded-lg border p-2 transition hover:-translate-y-0.5 hover:shadow-lift
                    ${isSelectedStart ? 'border-primary bg-primary text-primary-foreground' :
                      isSelectedEnd ? 'border-primary bg-primary text-primary-foreground' :
                      isSelectedRange ? 'border-primary/30 bg-primary/10' :
                      isToday ? 'border-primary bg-primary/5' : 'border-border bg-background'}`}
                  onClick={() => handleDayClick(day)}
                >
                  <div className={`font-semibold ${isSelectedStart || isSelectedEnd ? 'text-primary-foreground' : 'text-foreground'}`}>
                    {day}
                  </div>

                  {/* Multiple Birthdays */}
                  {dayBirthdays.length > 0 && (
                    <div className={`mt-1 truncate text-xs ${isSelectedStart || isSelectedEnd ? 'text-primary-foreground' : 'text-red-600'}`}>
                      {dayBirthdays.length > 1 ? `${dayBirthdays.length} birthdays` : dayBirthdays[0].display_name}
                    </div>
                  )}

                  {/* Multiple Events */}
                  {dayEvents.length > 0 && (
                    <div className={`mt-1 truncate text-xs ${isSelectedStart || isSelectedEnd ? 'text-primary-foreground' : 'text-primary'}`}>
                      {dayEvents.length > 1 ? `${dayEvents.length} events` : dayEvents[0].title}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </SectionCard>

        {/* Create Event Modal */}
        {showCreateModal && (
          <CreateEventModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateEvent}
            defaultStartDate={modalDates.start}
            defaultEndDate={modalDates.end}
            userId={userId}
          />
        )}

        {/* Month Stats */}
        {monthBirthdays.length > 0 && (
          <div className="mx-auto mt-8 max-w-4xl">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground">
              <Cake className="h-5 w-5 text-primary" />
              Birthdays This Month
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {monthBirthdays.map(birthday => {
                const birthdayDate = new Date(birthday.birthdate)
                return (
                  <div key={birthday.id} className="app-surface rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{birthday.display_name}</p>
                        <p className="text-sm text-muted-foreground">{birthdayDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</p>
                      </div>
                      <Cake className="h-7 w-7 text-accent" />
                    </div>
                    {birthday.nickname && <p className="text-xs text-gray-500 mt-1">Nickname: {birthday.nickname}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {eventsThisMonth.length > 0 && (
          <div className="mx-auto mt-8 max-w-4xl">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground">
              <CalendarDays className="h-5 w-5 text-primary" />
              This Month&apos;s Events
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {eventsThisMonth.map(event => {
                const eventDate = new Date(event.event_date)
                return (
                  <div key={event.id} className="app-surface rounded-lg border-l-4 border-primary p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-foreground">{event.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{eventDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        {event.description && <p className="mt-2 text-sm text-foreground/80">{event.description}</p>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {monthBirthdays.length === 0 && eventsThisMonth.length === 0 && (
          <EmptyState icon={CalendarDays} title="Nothing planned this month" description="Birthdays and visible events will show up here." className="mx-auto mt-8 max-w-4xl" />
        )}
    </PageShell>
  )
}

// Create Event Modal Component
function CreateEventModal({ onClose, onCreate, defaultStartDate, defaultEndDate, userId }) {
  const [formData, setFormData] = useState({
    creator_id: userId,
    title: '',
    description: '',
    startDate: defaultStartDate ? formatDateInput(defaultStartDate) : '',
    endDate: defaultEndDate ? formatDateInput(defaultEndDate) : '',
    location: '',
    is_multi_day: defaultEndDate ? true : false,
  })

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (name === 'is_multi_day' && !checked) {
      setFormData(prev => ({ ...prev, endDate: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!userId) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={onClose}>
      <div className="app-surface w-full max-w-2xl rounded-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">Create New Event</h2>
          <button onClick={onClose} className="text-2xl text-muted-foreground hover:text-foreground">x</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 focus:ring-2 focus:ring-primary/20"
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
              className="w-full rounded-lg border border-input bg-background px-3 py-2 focus:ring-2 focus:ring-primary/20"
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
                className="w-full rounded-lg border border-input bg-background px-3 py-2 focus:ring-2 focus:ring-primary/20"
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
              className="w-full rounded-lg border border-input bg-background px-3 py-2 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button type="submit" className="flex-1 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90">
              Create Event
            </button>
            <button type="button" onClick={onClose} className="flex-1 rounded-lg bg-muted px-4 py-2 font-semibold text-foreground hover:bg-muted/80">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
