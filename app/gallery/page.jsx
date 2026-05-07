'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Image as ImageIcon, Trash2, X } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { requireCurrentUser } from '@/lib/auth'

export default function GalleryPage() {
  const [photos, setPhotos] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deletingPhotoId, setDeletingPhotoId] = useState(null)
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
      const fileExt = file.name.split('.').pop()
      const safeExt = fileExt ? fileExt.toLowerCase().replace(/[^a-z0-9]/g, '') : 'jpg'
      const filePath = `${userId}/${Date.now()}.${safeExt}`

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

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

  const handleDeletePhoto = async (photo) => {
    if (!photo || photo.user_id !== userId) {
      alert('You can only delete photos you uploaded.')
      return
    }

    if (!window.confirm('Delete this photo?')) return

    setDeletingPhotoId(photo.id)

    try {
      const { error: storageError } = await supabase.storage
        .from('photos')
        .remove([photo.url])

      if (storageError) throw storageError

      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photo.id)
        .eq('user_id', userId)

      if (dbError) throw dbError

      setSelectedPhoto(current => current?.id === photo.id ? null : current)
      setPhotos(current => current.filter(item => item.id !== photo.id))
    } catch (error) {
      console.error('Delete photo error:', error)
      alert(`Delete failed: ${error.message}`)
    } finally {
      setDeletingPhotoId(null)
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
        <div className="mb-12 text-center">
          <h1 className="mb-4 flex items-center justify-center gap-3 text-4xl font-bold text-gray-800">
            <Camera className="h-9 w-9 text-blue-600" />
            Photo Gallery
          </h1>
          <p className="text-lg text-gray-600">Share and view photos from our adventures!</p>
        </div>

        <div className="mx-auto mb-8 max-w-4xl">
          <label className="block">
            <button
              type="button"
              onClick={() => document.getElementById('photo-upload').click()}
              disabled={uploading || !userId}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-4 font-semibold text-white shadow-md transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              <Camera className="h-5 w-5" />
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </button>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading || !userId}
            />
          </label>
        </div>

        {photos.length === 0 ? (
          <div className="mx-auto max-w-4xl py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
              <ImageIcon className="h-8 w-8 text-slate-500" />
            </div>
            <p className="text-lg text-gray-500">No photos yet!</p>
            <p className="text-gray-400">Upload the first photo from this device.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {photos.map((photo) => {
              const canDelete = photo.user_id === userId
              const isDeleting = deletingPhotoId === photo.id

              return (
                <div
                  key={photo.id}
                  className="overflow-hidden rounded-xl bg-white shadow-md transition-shadow hover:shadow-xl"
                >
                  <button
                    type="button"
                    className="block w-full cursor-pointer text-left"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <div className="relative aspect-square">
                      <img
                        src={photo.publicUrl}
                        alt="Gallery"
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </button>
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{photo.displayName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(photo.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(photo)}
                        disabled={isDeleting}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Delete photo"
                        aria-label="Delete photo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/10"
            onClick={() => setSelectedPhoto(null)}
            aria-label="Close photo"
          >
            <X className="h-6 w-6" />
          </button>
          <div
            className="max-h-screen max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedPhoto.publicUrl}
              alt="Enlarged"
              className="max-h-screen max-w-full rounded-lg object-contain"
            />
            <div className="mt-4 flex items-center justify-center gap-4 text-white">
              <div className="text-center">
                <p className="text-lg font-semibold">{selectedPhoto.displayName}</p>
                <p className="text-sm opacity-75">
                  {new Date(selectedPhoto.created_at).toLocaleString()}
                </p>
              </div>
              {selectedPhoto.user_id === userId && (
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(selectedPhoto)}
                  disabled={deletingPhotoId === selectedPhoto.id}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Delete photo"
                  aria-label="Delete photo"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="mt-12 bg-gray-900 py-8 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">
            2026 Friends Hub - Photos stored in Supabase Cloud - {photos.length} photos
          </p>
        </div>
      </footer>
    </div>
  )
}
