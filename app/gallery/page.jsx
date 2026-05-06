'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { requireCurrentUser } from '@/lib/auth'

export default function GalleryPage() {
  const [photos, setPhotos] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
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
    if (!isLoaded || !userId) return

    loadPhotos()

    // Real-time subscription
    const channel = supabase
      .channel('photos-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, loadPhotos)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isLoaded, userId])

  const loadPhotos = async () => {
    const { data } = await supabase
      .from('photos')
      .select(`
        *,
        profiles (
          id,
          display_name,
          nickname
        )
      `)
      .order('created_at', { ascending: false })

    if (data) {
      const loadedPhotos = await Promise.all(
        data.map(async (photo) => {
          const { data: signedUrlData } = await supabase.storage
            .from('photos')
            .createSignedUrl(photo.url, 60 * 60)

          return {
            ...photo,
            publicUrl: signedUrlData?.signedUrl || '',
            displayName: photo.profiles?.display_name || photo.profiles?.nickname || 'Anonymous',
          }
        })
      )
      setPhotos(loadedPhotos)
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file || !userId) {
      alert('Please select a file and ensure you are logged in!')
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file!')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit!')
      return
    }

    setUploading(true)

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const safeExt = fileExt ? fileExt.toLowerCase().replace(/[^a-z0-9]/g, '') : 'jpg'
      const filePath = `${userId}/${Date.now()}.${safeExt}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('photos')
        .insert([{
          user_id: userId,
          url: filePath,
          caption: '',
        }])

      if (dbError) throw dbError

      await loadPhotos()
      alert('Photo uploaded successfully!')
    } catch (error) {
      console.error('Upload error:', error)
      alert(`Upload failed: ${error.message}`)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-20">Loading gallery...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">📸 Photo Gallery</h1>
          <p className="text-lg text-gray-600">Share and view photos from our adventures!</p>
        </div>

        {/* Upload Button */}
        <div className="max-w-4xl mx-auto mb-8">
          <label className="block">
            <button
              type="button"
              onClick={() => document.getElementById('photo-upload').click()}
              disabled={uploading && !userId}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors shadow-md disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : '📷 Upload Photo'}
            </button>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading && !userId}
            />
          </label>
        </div>

        {/* Photo Grid */}
        {photos.length === 0 ? (
          <div className="max-w-4xl mx-auto text-center py-12">
            <div className="text-6xl mb-4">🖼️</div>
            <p className="text-gray-500 text-lg">No photos yet!</p>
            <p className="text-gray-400">Upload the first photo from this device.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="aspect-square relative">
                  <img
                    src={photo.publicUrl}
                    alt="Gallery"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-3">
                  <p className="font-medium text-gray-900 text-sm truncate">{photo.displayName}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(photo.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl font-bold"
            onClick={() => setSelectedPhoto(null)}
          >
            ✕
          </button>
          <div
            className="max-w-4xl max-h-screen"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedPhoto.publicUrl}
              alt="Enlarged"
              className="max-w-full max-h-screen object-contain rounded-lg"
            />
            <div className="text-white text-center mt-4">
              <p className="font-semibold text-lg">{selectedPhoto.displayName}</p>
              <p className="text-sm opacity-75">
                {new Date(selectedPhoto.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">
            © 2026 Friends Hub • Photos stored in Supabase Cloud • {photos.length} photos
          </p>
        </div>
      </footer>
    </div>
  )
}
