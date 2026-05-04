import { supabase } from './supabase'

export async function canDeleteContent(userId: string, resourceType: 'event' | 'photo', resourceId: string): Promise<{ allowed: boolean; reason: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { allowed: false, reason: 'Not logged in' }
    }
    
    if (user.id !== userId) {
      return { allowed: false, reason: 'Not the owner' }
    }
    
    return { allowed: true, reason: 'OK' }
  } catch (error) {
    console.error('Can delete check error:', error)
    return { allowed: false, reason: 'Error checking permissions' }
  }
}

export async function deleteEvent(eventId: string, ownerId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('creator_id', ownerId)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Delete event error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function deletePhoto(photoId: string, ownerId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete from storage
    const { data: photoData } = await supabase
      .from('photos')
      .select('url')
      .eq('id', photoId)
      .eq('user_id', ownerId)
      .single()
    
    if (photoData && photoData.url) {
      const { error: storageError } = await supabase
        .storage
        .from('photos')
        .remove([photoData.url])
      
      if (storageError && !storageError.message.includes('object does not exist')) {
        console.error('Storage delete error:', storageError)
      }
    }
    
    // Delete from database
    const { error } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId)
      .eq('user_id', ownerId)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Delete photo error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
