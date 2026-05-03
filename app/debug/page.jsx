'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugPage() {
  const [testEmail, setTestEmail] = useState('')
  const [testPassword, setTestPassword] = useState('')
  const [result, setResult] = useState(null)
  const [steps, setSteps] = useState([])

  const addStep = (msg) => setSteps(prev => [...prev, msg])

  const testSupabaseConnection = async () => {
    setSteps([])
    setResult(null)

    addStep('🧪 Step 1: Checking Supabase connection...')
    try {
      const { data, error } = await supabase.from('profiles').select('count').single()
      if (error) {
        addStep('❌ Connection error: ' + error.message)
        setResult({ type: 'error', error })
        return
      }
      addStep('✅ Supabase connected: projects/' + supabase.projectId)
    } catch (e) {
      addStep('❌ Exception: ' + e.message)
      setResult({ type: 'error', error: e })
      return
    }

    addStep('🧪 Step 2: Checking auth.users count...')
    try {
      // This is the critical test - checking if Supabase thinks email exists
      const { data: authUsers, error: authError } = await supabase
        .from('auth.users')
        .select('email')

      if (authError) {
        // auth.users might not be directly accessible via RPC
        addStep('⚠️  auth.users not directly accessible (this is normal)')
      } else {
        if (authUsers.length === 0) {
          addStep('✅ auth.users is EMPTY - good!')
        } else {
          addStep('❌ auth.users has ' + authUsers.length + ' users:')
          authUsers.forEach(u => addStep('   - ' + u.email))
        }
      }
    } catch (e) {
      addStep('⚠️  Auth table check failed (expected): ' + e.message)
    }

    addStep('🧪 Step 3: Direct SignUp test with Supabase client...')
    
    const email = testEmail.trim().toLowerCase()
    const password = testPassword.trim()

    if (!email || !password) {
      addStep('❌ Please enter email and password')
      return
    }

    if (password.length < 6) {
      addStep('❌ Password must be at least 6 characters')
      return
    }

    try {
      // Direct Supabase auth sign up
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: email,
        password: password,
      })

      if (signupError) {
        addStep('❌ SIGNUP FAILED: ' + signupError.message)
        addStep('📋 Error details:')
        addStep('   - Code: ' + signupError.code)
        addStep('   - Status: ' + signupError.status)
        
        // Check for specific error types
        if (signupError.message.includes('already registered')) {
          addStep('💡 This email was tried before - even if data is gone!')
          addStep('💡 Try: Use a different email or delete from Supabase dashboard')
        }
        
        if (signupError.message.includes('conflict')) {
          addStep('💡 Database conflict detected!')
          addStep('💡 This means a user with this email exists somewhere in Supabase')
          addStep('💡 Go to: https://supabase.com/dashboard/auth/users and delete ALL users manually')
        }
        
        setResult({ type: 'error', error: signupError })
      } else {
        addStep('✅ SIGNUP SUCCESS!')
        addStep('   User ID: ' + signupData.user?.id)
        addStep('   Email: ' + signupData.user?.email)
        
        // Now try to create profile
        addStep('🧪 Step 4: Creating profile record...')
        
        if (signupData.user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .insert([{
              id: signupData.user.id,
              email: email,
              display_name: 'Test User',
              nickname: 'tester',
            }])

          if (profileError) {
            addStep('❌ Profile creation failed: ' + profileError.message)
          } else {
            addStep('✅ Profile created successfully!')
            addStep('   Profile ID: ' + profileData[0]?.id)
          }
        }
        
        setResult({ type: 'success', data: signupData.user })
      }
    } catch (e) {
      addStep('❌ Exception: ' + e.message)
      setResult({ type: 'error', error: e })
    }
  }

  const clearLocalStorage = () => {
    localStorage.clear()
    addStep('🗑️  localStorage cleared! Refresh page and try again.')
  }

  // Check for cached errors
  const [cachedError, setCachedError] = useState(null)
  const [cachedData, setCachedData] = useState(null)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">🔍 Deep Debug Page</h1>
        <p className="text-gray-600 mb-6">Test Supabase auth connection directly</p>
        
        {/* Test Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Email Authentication</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="test@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password (min 6 chars)</label>
              <input
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="password123"
              />
            </div>
            
            <button
              onClick={testSupabaseConnection}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
            >
              🧪 Test Sign Up
            </button>
            
            <button
              onClick={clearLocalStorage}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold"
            >
              🗑️ Clear localStorage
            </button>
          </div>
        </div>

        {/* Steps */}
        {steps.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">📋 Debug Steps</h2>
            <div className="space-y-2 font-mono text-sm">
              {steps.map((step, i) => (
                <div key={i} className="text-gray-700">{step}</div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className={`rounded-lg shadow-md p-6 ${result.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
            <h2 className={`text-xl font-semibold mb-4 ${result.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
              {result.type === 'success' ? '✅ SUCCESS' : '❌ ERROR'}
            </h2>
            <div className="text-sm text-gray-700">
              <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        )}

        {/* Known Issues */}
        <div className="bg-yellow-50 border-l-4 border-yellow-600 p-6">
          <h3 className="font-semibold text-lg mb-2">⚠️ Known Issues That May Cause This:</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li><strong>Supabase email rate limiting:</strong> Supabase remembers attempted emails even after deletion</li>
            <li><strong>Browser cache:</strong> Try incognito/private browsing mode</li>
            <li><strong>Different Supabase project:</strong> Make sure you're connecting to the correct project</li>
            <li><strong>Environment variables wrong:</strong> Verify Vercel has correct keys</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
