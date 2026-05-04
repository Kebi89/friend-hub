// Need to update handleDeleteEvent to check if current user is creator
// Currently it allows anyone to delete any event

// Current code:
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

// Should be:
const handleDeleteEvent = async (eventId) => {
  if (!window.confirm('Delete this event?')) return
  
  // Get current user id
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    alert('Please log in')
    return
  }
  
  // Check if user is the creator
  const event = events.find(e => e.id === eventId)
  if (!event || event.creator_id !== user.id) {
    alert('You can only delete your own events')
    return
  }
  
  const { error } = await supabase.from('events').delete().eq('id', eventId).eq('creator_id', user.id)
  if (error) {
    alert(`Delete failed: ${error.message}`)
  } else {
    alert('Event deleted!')
    loadEvents()
  }
}
