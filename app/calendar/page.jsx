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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, loadEvents)
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

    for (let i = 0; i < firstDay; days.push(null), i++) {}
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

  if (!isLoaded) {
    return <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white"><Navbar /><main className="container mx-auto px-4 py-8"><div className="text-center py-20">Loading calendar...</div></main></div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">📅 Calendar</h1>
          <p className="text-lg text-gray-600">Track birthdays and upcoming events!</p>
        </div>

        <div className="flex justify-between items-center mb-6 max-w-4xl mx-auto">
          <button onClick={prevMonth} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">← Previous</button>
          <h2 className="text-2xl font-bold text-gray-800">{getMonthName(currentDate)}</h2>
          <button onClick={nextMonth} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Next →</button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 max-w-6xl mx-auto">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-gray-700 py-2">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              if (!day) return <div key={`empty-${index}`} className="aspect-square"></div>

              const dayBirthdays = getBirthdaysForDay(day)
              const dayEvents = getEventsForDay(day)

              const isToday = day === new Date().getDate() && 
                             currentDate.getMonth() === new Date().getMonth() &&
                             currentDate.getFullYear() === new Date().getFullYear()

              return (
                <div key={day} className={`aspect-square border rounded-lg p-2 relative hover:shadow-md transition-shadow ${isToday ? 'bg-blue-50 border-blue-500' : 'bg-white'}`}>
                  <div className="font-semibold text-gray-900">{day}</div>
                  {dayBirthdays.map(birthday => (
                    <div key={birthday.id} className="text-xs mt-1 bg-red-500 text-white px-1.5 py-0.5 rounded truncate" title={`${birthday.display_name}'s birthday`}>
                      {birthday.display_name}
                    </div>
                  ))}
                  {dayEvents.map(event => (
                    <div key={event.id} className="text-xs mt-1 bg-blue-500 text-white px-1.5 py-0.5 rounded truncate" title={event.title}>
                      {event.title}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {monthBirthdays.length > 0 && (
          <div className="max-w-4xl mx-auto mt-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">🎉 Birthdays This Month</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {monthBirthdays.map(birthday => {
                const birthdayDate = new Date(birthday.birthdate)
                return (
                  <div key={birthday.id} className="bg-white border-l-4 border-red-500 rounded-lg shadow-md p-4">
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
                        <p className="text-xs text-gray-500 mt-2">Created by: {event.profiles?.display_name || event.profiles?.nickname || 'Anonymous'}</p>
                      </div>
                      <div className="text-2xl">📍</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <footer className="bg-gray-900 text-white py-8 mt-12">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-gray-400">
              © 2026 Friends Hub • {monthBirthdays.length} birthday{monthBirthdays.length !== 1 ? 's' : ''} • {eventsThisMonth.length} event{eventsThisMonth.length !== 1 ? 's' : ''} this month
            </p>
          </div>
        </footer>
      </main>
    </div>
  )
}
