import { supabase } from './supabase'

export const HUB_CHAT_ID = '00000000-0000-0000-0000-000000000001'

// ============================================
// SIGN UP
// ============================================
export async function signUp(email: string, password: string, displayName: string, nickname: string | null = null, birthdate: string | null = null, bankAccount: string | null = null) {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('User creation failed')

    // Create profile in database
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: authData.user.id,
        email,
        display_name: displayName,
        nickname,
        birthdate,
        bank_account: bankAccount,
      }])

    if (profileError) {
      throw profileError
    }

    localStorage.setItem('authenticatedUser', 'true')
    return { success: true, user: authData.user, profile: true }
  } catch (error) {
    console.error('Signup error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Signup failed' }
  }
}

// ============================================
// SIGN IN
// ============================================
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    if (!data.user) throw new Error('No user found')

    localStorage.setItem('authenticatedUser', 'true')
    return { success: true, user: data.user }
  } catch (error) {
    console.error('SignIn error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Sign in failed' }
  }
}

// ============================================
// SIGN OUT
// ============================================
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    localStorage.removeItem('authenticatedUser')
    return { success: true }
  } catch (error) {
    console.error('SignOut error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Sign out failed' }
  }
}

// ============================================
// GET CURRENT USER
// ============================================
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) localStorage.removeItem('authenticatedUser')
  return user
}

export async function requireCurrentUser() {
  const user = await getCurrentUser()
  if (user) {
    localStorage.setItem('authenticatedUser', 'true')
  }
  return user
}

// ============================================
// GET USER PROFILE
// ============================================
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Get profile error:', error)
    return null
  }
}

// ============================================
// UPDATE USER PROFILE
// ============================================
export async function updateUserProfile(userId: string, updates: Partial<{
  display_name: string
  nickname: string | null
  birthdate: string | null
  bank_account: string | null
}>) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Update profile error:', error)
    return null
  }
}

// ============================================
// SAVE MESSAGE TO DATABASE
// ============================================
export async function saveMessage(userId: string, content: string, chatId: string = HUB_CHAT_ID) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        user_id: userId,
        chat_id: chatId,
        content: content,
      }])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Save message error:', error)
    return null
  }
}

// ============================================
// GET ALL MESSAGES
// ============================================
export async function getAllMessages() {
  return getMessagesForChat(HUB_CHAT_ID)
}

// ============================================
// GET MESSAGES FOR A CHAT
// ============================================
export async function getMessagesForChat(chatId: string) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles (
          id,
          display_name,
          nickname
        )
      `)
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get messages error:', error)
      return []
    }

    // Transform data to match local format
    return data.map(msg => ({
      id: msg.id,
      chatId: msg.chat_id,
      user: msg.profiles?.display_name || msg.profiles?.nickname || 'Anonymous',
      text: msg.content,
      timestamp: msg.created_at,
    }))
  } catch (error) {
    console.error('Get messages error:', error)
    return []
  }
}

// ============================================
// GET VISIBLE CHATS
// ============================================
export async function getVisibleChats(userId: string) {
  try {
    const { data: hubChats, error: hubError } = await supabase
      .from('chats')
      .select('id, title, type, event_id, is_pinned, created_at')
      .eq('type', 'hub')
      .order('is_pinned', { ascending: false })

    if (hubError) throw hubError

    const { data: memberships, error: membershipError } = await supabase
      .from('chat_members')
      .select(`
        chats (
          id,
          title,
          type,
          event_id,
          is_pinned,
          created_at,
          events (
            title,
            event_date,
            end_date
          )
        )
      `)
      .eq('user_id', userId)

    if (membershipError) throw membershipError

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const eventChats = (memberships || [])
      .map((membership: any) => membership.chats)
      .filter(Boolean)
      .filter((chat: any) => {
        if (chat.type !== 'event') return false
        const rawEndDate = chat.events?.end_date || chat.events?.event_date
        if (!rawEndDate) return true
        return new Date(`${rawEndDate}T00:00:00`) >= today
      })

    const uniqueChats = [...(hubChats || []), ...eventChats].reduce((acc: any[], chat: any) => {
      if (!acc.some((existing) => existing.id === chat.id)) acc.push(chat)
      return acc
    }, [])

    return uniqueChats.map((chat: any) => ({
      id: chat.id,
      title: chat.title,
      type: chat.type,
      eventId: chat.event_id,
      isPinned: chat.is_pinned,
      createdAt: chat.created_at,
      eventDate: chat.events?.event_date || null,
      endDate: chat.events?.end_date || null,
    }))
  } catch (error) {
    console.error('Get chats error:', error)
    return []
  }
}

// ============================================
// CREATE EVENT CHAT
// ============================================
export async function createEventChat(eventId: string, title: string, createdBy: string, memberIds: string[]) {
  try {
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .insert([{
        title,
        type: 'event',
        event_id: eventId,
        created_by: createdBy,
      }])
      .select()
      .single()

    if (chatError) throw chatError

    const uniqueMemberIds = Array.from(new Set([createdBy, ...memberIds].filter(Boolean)))
    const memberRows = uniqueMemberIds.map((memberId) => ({
      chat_id: chat.id,
      user_id: memberId,
    }))

    const { error: memberError } = await supabase
      .from('chat_members')
      .insert(memberRows)

    if (memberError) throw memberError
    return chat
  } catch (error) {
    console.error('Create event chat error:', error)
    return null
  }
}

// ============================================
// DELETE MESSAGE
// ============================================
export async function deleteMessage(messageId: string) {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Delete message error:', error)
    return false
  }
}

// ============================================
// CHECK IF USER IS LOGGED IN
// ============================================
export function isUserLoggedIn(): boolean {
  // UI hint only. Protected actions must verify the Supabase session.
  return !!localStorage.getItem('authenticatedUser')
}

// ============================================
// GET CURRENT USER ID
// ============================================
export async function getCurrentUserId(): Promise<string | null> {
  const user = await requireCurrentUser()
  return user?.id || null
}
