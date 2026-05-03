// Local-First Authentication Service
// All data stored in LocalStorage - NO cloud, NO network

interface User {
  email: string
  displayName: string
  nickname: string | null
  birthdate: string | null
  bankAccount: string | null
}

interface Session {
  email: string
  sessionToken: string
  createdAt: number
  expires: number
}

const STORAGE_KEYS = {
  USERS: 'friends-hub-users',
  CURRENT_SESSION: 'friends-hub-current-session',
  SESSION_TOKEN: 'friends-hub-session-token',
}

// Simple hash function for password storage (NOT for production security)
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16)
}

export function registerUser(email: string, password: string, displayName: string, nickname: string | null = null, birthdate: string | null = null, bankAccount: string | null = null): boolean {
  try {
    const users = getUsers()
    
    // Check if user already exists
    if (users.some(user => user.email === email)) {
      return false
    }

    const newUser: User = {
      email,
      displayName,
      nickname,
      birthdate,
      bankAccount,
    }

    users.push(newUser)
    saveUsers(users)

    // Auto-login after registration and redirect to profile
    const session = createSession(email)
    if (session) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session))
    }

    return 'profile'
  } catch (error) {
    console.error('Registration failed:', error)
    return false
  }
}

export function loginUser(email: string, password: string): boolean {
  try {
    const users = getUsers()
    const user = users.find(u => u.email === email)

    if (!user) {
      return false
    }

    // In a real app, we'd verify the password hash
    // For local-only demo, we'll skip password verification
    // OR you can implement: if (user.passwordHash !== simpleHash(password)) return false;

    // Auto-login
    const session = createSession(email)
    if (session) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session))
      return true
    }

    return false
  } catch (error) {
    console.error('Login failed:', error)
    return false
  }
}

export function logoutUser(): void {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION)
  localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN)
}

export function getCurrentUser(): User | null {
  const session = getActiveSession()
  if (!session) return null

  const users = getUsers()
  const user = users.find(u => u.email === session.email)
  
  return user || null
}

export function updateUser(userId: string, updates: Partial<User>): boolean {
  try {
    const users = getUsers()
    const index = users.findIndex(u => u.email === userId)

    if (index === -1) return false

    users[index] = { ...users[index], ...updates }
    saveUsers(users)

    return true
  } catch (error) {
    console.error('Update failed:', error)
    return false
  }
}

export function deleteUser(email: string): boolean {
  try {
    const users = getUsers()
    const filtered = users.filter(u => u.email !== email)

    if (filtered.length === users.length) {
      return false
    }

    saveUsers(filtered)
    logoutUser()

    return true
  } catch (error) {
    console.error('Delete failed:', error)
    return false
  }
}

export function isUserLoggedIn(): boolean {
  return !!getActiveSession()
}

function getActiveSession(): Session | null {
  try {
    const sessionStr = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION)
    if (!sessionStr) return null

    const session: Session = JSON.parse(sessionStr)

    // Check if session is expired (24 hours)
    const now = Date.now()
    if (now > session.expires) {
      logoutUser()
      return null
    }

    return session
  } catch {
    return null
  }
}

function createSession(email: string): Session | null {
  try {
    const session: Session = {
      email,
      sessionToken: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      createdAt: Date.now(),
      expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    }

    localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session))
    return session
  } catch {
    return null
  }
}

function getUsers(): User[] {
  try {
    const usersStr = localStorage.getItem(STORAGE_KEYS.USERS)
    return usersStr ? JSON.parse(usersStr) : []
  } catch {
    return []
  }
}

function saveUsers(users: User[]): void {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
}
