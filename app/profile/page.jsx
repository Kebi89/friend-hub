'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, LogOut, User } from 'lucide-react'
import { PageHeader, PageShell, SectionCard } from '@/components/ui/page-shell'
import { updateUserProfile, signOut as supabaseSignOut, getUserProfile, requireCurrentUser } from '@/lib/auth'

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
      const currentUser = await requireCurrentUser()
      if (!currentUser) {
        router.push('/auth')
        return
      }

      const userProfile = await getUserProfile(currentUser.id)
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

    const currentUser = await requireCurrentUser()
    if (!currentUser) {
      setError('Not authenticated')
      setSaving(false)
      return
    }

    const result = await updateUserProfile(currentUser.id, {
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
      router.push('/auth')
    }
  }

  if (loading) {
    return (
      <PageShell>
        <div className="py-20 text-center">
          <div className="animate-pulse text-lg text-muted-foreground">Loading profile...</div>
        </div>
      </PageShell>
    )
  }

  if (!user) return null

  return (
    <PageShell>
        <div className="max-w-2xl mx-auto">
          <PageHeader icon={User} title="Your Profile" description="Manage the personal details used across Friends Hub." />

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          <SectionCard className="mb-6">
            <h2 className="mb-4 text-xl font-semibold text-foreground">Edit Profile</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">Display Name *</label>
                <input 
                  type="text" 
                  id="displayName" 
                  value={formData.displayName} 
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})} 
                  placeholder="Your name (appears on messages)" 
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 focus:ring-2 focus:ring-primary/20" 
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
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 focus:ring-2 focus:ring-primary/20" 
                />
              </div>

              <div>
                <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-2">Birthdate</label>
                <input 
                  type="date" 
                  id="birthdate" 
                  value={formData.birthdate} 
                  onChange={(e) => setFormData({...formData, birthdate: e.target.value})} 
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 focus:ring-2 focus:ring-primary/20" 
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
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 focus:ring-2 focus:ring-primary/20" 
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="flex-1 rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  type="button" 
                  onClick={handleLogout} 
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              </div>
            </form>
          </SectionCard>

          <SectionCard className="bg-secondary">
            <h3 className="font-semibold text-secondary-foreground mb-3">Current Information</h3>
            <div className="space-y-2 text-sm text-secondary-foreground">
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
          </SectionCard>

          <div className="text-center mt-6">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
    </PageShell>
  )
}
