'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { updateUserProfile, signOut as supabaseSignOut, getUserProfile, getCurrentUserId } from '@/lib/auth'

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState({
    displayName: '',
    nickname: '',
    birthdate: '',
    bankAccount: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = localStorage.getItem('authenticatedUser')
      if (authStatus !== 'true') {
        router.push('/auth')
        return
      }

      const currentUserId = await getCurrentUserId()
      if (!currentUserId) {
        setLoading(false)
        return
      }

      const userProfile = await getUserProfile(currentUserId)
      if (userProfile) {
        setUser(userProfile)
        setFormData({
          displayName: userProfile.display_name || '',
          nickname: userProfile.nickname || '',
          birthdate: userProfile.birthdate || '',
          bankAccount: userProfile.bank_account || '',
        })
      }
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    const currentUserId = await getCurrentUserId()
    if (!currentUserId) {
      setError('Not authenticated')
      setSaving(false)
      return
    }

    const result = await updateUserProfile(currentUserId, {
      display_name: formData.displayName,
      nickname: formData.nickname || null,
      birthdate: formData.birthdate || null,
      bank_account: formData.bankAccount || null,
    })

    if (result) {
      setSuccess('Profile updated successfully!')
      setUser(result)
      setFormData({
        displayName: result.display_name,
        nickname: result.nickname || '',
        birthdate: result.birthdate || '',
        bankAccount: result.bank_account || '',
      })
    } else {
      setError('Failed to update profile')
    }

    setSaving(false)
  }

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await supabaseSignOut()
      localStorage.removeItem('authenticatedUser')
      router.push('/auth')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="animate-pulse text-lg text-gray-500">Loading profile...</div>
          </div>
        </main>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">👤 Your Profile</h1>
            <p className="text-gray-600">Manage your personal information</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-6 rounded">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-600 p-4 mb-6 rounded">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Edit Profile</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">Display Name *</label>
                <input 
                  type="text" 
                  id="displayName" 
                  value={formData.displayName} 
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})} 
                  placeholder="Your name (appears on messages)" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  required 
                />
              </div>

              <div>
                <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">Nickname (Optional)</label>
                <input 
                  type="text" 
                  id="nickname" 
                  value={formData.nickname} 
                  onChange={(e) => setFormData({...formData, nickname: e.target.value})} 
                  placeholder="A fun nickname (optional)" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
              </div>

              <div>
                <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-2">Birthdate</label>
                <input 
                  type="date" 
                  id="birthdate" 
                  value={formData.birthdate} 
                  onChange={(e) => setFormData({...formData, birthdate: e.target.value})} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
              </div>

              <div>
                <label htmlFor="bankAccount" className="block text-sm font-medium text-gray-700 mb-2">Bank Account Number (Optional)</label>
                <input 
                  type="text" 
                  id="bankAccount" 
                  value={formData.bankAccount} 
                  onChange={(e) => setFormData({...formData, bankAccount: e.target.value})} 
                  placeholder="For split billing (optional)" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  type="button" 
                  onClick={handleLogout} 
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Log Out
                </button>
              </div>
            </form>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">Current Information</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex justify-between">
                <span>Display Name:</span>
                <span className="font-semibold">{user.display_name}</span>
              </div>
              {user.nickname && (
                <div className="flex justify-between">
                  <span>Nickname:</span>
                  <span className="font-semibold">{user.nickname}</span>
                </div>
              )}
              {user.birthdate && (
                <div className="flex justify-between">
                  <span>Birthday:</span>
                  <span className="font-semibold">{new Date(user.birthdate).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Email:</span>
                <span className="font-semibold">{user.email}</span>
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <a href="/" className="text-gray-600 hover:text-gray-800 text-sm">← Back to Home</a>
          </div>
        </div>
      </main>
    </div>
  )
}
