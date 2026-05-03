'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { getCurrentUser, isUserLoggedIn, updateUser, logoutUser } from '@/lib/auth'

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
    if (!isUserLoggedIn()) {
      router.push('/auth')
      return
    }

    const currentUser = getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
      setFormData({
        displayName: currentUser.displayName,
        nickname: currentUser.nickname || '',
        birthdate: currentUser.birthdate || '',
        bankAccount: currentUser.bankAccount || '',
      })
    }
    setLoading(false)
  }, [router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    const success = updateUser(user.email, formData)
    
    if (success) {
      setSuccess('Profile updated successfully!')
      setUser({ ...user, ...formData })
      setFormData(formData)
    } else {
      setError('Failed to update profile')
    }

    setSaving(false)
  }

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logoutUser()
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

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">👤 Your Profile</h1>
            <p className="text-gray-600">Manage your personal information</p>
          </div>

          {/* Success/Error Messages */}
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

          {/* Profile Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Edit Profile</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                  placeholder="Your name (appears on messages)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This name will be used on all your messages and in group activities
                </p>
              </div>

              <div>
                <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
                  Nickname (Optional)
                </label>
                <input
                  type="text"
                  id="nickname"
                  value={formData.nickname}
                  onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                  placeholder="A fun nickname (optional)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This can be used instead of your display name
                </p>
              </div>

              <div>
                <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-2">
                  Birthdate
                </label>
                <input
                  type="date"
                  id="birthdate"
                  value={formData.birthdate}
                  onChange={(e) => setFormData({...formData, birthdate: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your birthday will be automatically added to the calendar for everyone to see
                </p>
              </div>

              <div>
                <label htmlFor="bankAccount" className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Account Number (Optional)
                </label>
                <input
                  type="text"
                  id="bankAccount"
                  value={formData.bankAccount}
                  onChange={(e) => setFormData({...formData, bankAccount: e.target.value})}
                  placeholder="For split billing (optional)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Encrypted and stored locally - only visible to you
                </p>
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

          {/* Current User Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">Current Information</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex justify-between">
                <span>Display Name:</span>
                <span className="font-semibold">{user.displayName}</span>
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

          {/* Back to Home */}
          <div className="text-center mt-6">
            <a href="/" className="text-gray-600 hover:text-gray-800 text-sm">
              Back to Home
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
