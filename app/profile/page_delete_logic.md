// Update photo upload to include delete functionality
// Photos currently can't be deleted

// Need to:
// 1. Add delete button to each photo in Gallery
// 2. Check owner before deleting
// 3. Delete from both Supabase Storage and Database

// Sample delete photo function:
const handleDeletePhoto = async (photoId) => {
  if (!window.confirm('Delete this photo?')) return
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    alert('Please log in')
    return
  }
  
  // Get photo details
  const { data: photoData, error: fetchError } = await supabase
    .from('photos')
    .select('*')
    .eq('id', photoId)
    .single()
  
  if (fetchError || !photoData) {
    alert('Photo not found')
    return
  }
  
  // Check ownership
  if (photoData.user_id !== user.id) {
    alert('You can only delete your own photos')
    return
  }
  
  // Delete from storage
  const { error: removeError } = await supabase
    .storage
    .from('photos')
    .remove([photoData.url])
  
  if (removeError) {
    console.error('Storage delete error:', removeError)
  }
  
  // Delete from database
  const { error: dbError } = await supabase
    .from('photos')
    .delete()
    .eq('id', photoId)
  
  if (dbError) {
    alert(`Delete failed: ${dbError.message}`)
  } else {
    alert('Photo deleted!')
    // Reload photos
    const { data: photosData } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6)
    
    if (photosData) {
      const loadedPhotos = await Promise.all(
        photosData.map(async (photo) => {
          const { data: publicUrlData } = await supabase.storage
            .from('photos')
            .getPublicUrl(photo.url)
          
          return { ...photo, publicUrl: publicUrlData.publicUrl }
        })
      )
      setRecentPhotos(loadedPhotos)
    }
  }
}
