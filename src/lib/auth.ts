import { supabase, isSupabaseConfigured } from './supabase/client'
import type { Agency, AgencyMember, AuthState } from '../types'

let currentAuthState: AuthState = {
  user: null,
  agency: null,
  member: null,
  isLoading: true,
  isAuthenticated: false
}

const listeners = new Set<(state: AuthState) => void>()

function notifyListeners() {
  listeners.forEach((listener) => listener(currentAuthState))
}

export function getAuthState(): AuthState {
  return currentAuthState
}

export function getCurrentAgencyId(): string | null {
  return currentAuthState.agency?.id || null
}

export function subscribeAuthState(listener: (state: AuthState) => void): () => void {
  listeners.add(listener)
  listener(currentAuthState)
  return () => {
    listeners.delete(listener)
  }
}

// Resolve agency and membership for a given user
export async function resolveUserAgency(userId: string): Promise<{ agency: Agency | null; member: AgencyMember | null }> {
  if (!isSupabaseConfigured) {
    return { agency: null, member: null }
  }

  try {
    // 1. Check existing agency membership
    const { data: memberData, error: memberErr } = await supabase
      .from('agency_members')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (memberErr) {
      console.warn('[Auth] Member lookup warning:', memberErr.message)
    }

    if (memberData) {
      const { data: agencyData, error: agencyErr } = await supabase
        .from('agencies')
        .select('*')
        .eq('id', memberData.agency_id)
        .maybeSingle()

      if (!agencyErr && agencyData) {
        return {
          agency: agencyData as Agency,
          member: memberData as AgencyMember
        }
      }
    }

    // 2. Fallback: If user is authenticated but has no agency_members record yet,
    // attach to default agency if one exists
    const { data: defaultAgency } = await supabase
      .from('agencies')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (defaultAgency) {
      const newMember: Partial<AgencyMember> = {
        agency_id: defaultAgency.id,
        user_id: userId,
        role: 'agent'
      }
      const { data: createdMember } = await supabase
        .from('agency_members')
        .insert(newMember)
        .select('*')
        .maybeSingle()

      return {
        agency: defaultAgency as Agency,
        member: (createdMember as AgencyMember) || {
          id: 'temp',
          agency_id: defaultAgency.id,
          user_id: userId,
          role: 'agent'
        }
      }
    }

    return { agency: null, member: null }
  } catch (err) {
    console.warn('[Auth] resolveUserAgency error:', err)
    return { agency: null, member: null }
  }
}

let isInitialized = false

// Initialize Supabase Auth session & listener
export async function initAuth(): Promise<AuthState> {
  if (!isSupabaseConfigured) {
    currentAuthState = {
      user: null,
      agency: null,
      member: null,
      isLoading: false,
      isAuthenticated: false
    }
    notifyListeners()
    return currentAuthState
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.warn('[Auth] getSession error:', error.message)
    }

    if (session?.user) {
      const { agency, member } = await resolveUserAgency(session.user.id)
      currentAuthState = {
        user: session.user,
        agency,
        member,
        isLoading: false,
        isAuthenticated: true
      }
    } else {
      currentAuthState = {
        user: null,
        agency: null,
        member: null,
        isLoading: false,
        isAuthenticated: false
      }
    }

    // Listen to Supabase auth state changes
    if (!isInitialized) {
      isInitialized = true
      supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (newSession?.user) {
          const { agency, member } = await resolveUserAgency(newSession.user.id)
          currentAuthState = {
            user: newSession.user,
            agency,
            member,
            isLoading: false,
            isAuthenticated: true
          }
        } else {
          currentAuthState = {
            user: null,
            agency: null,
            member: null,
            isLoading: false,
            isAuthenticated: false
          }
        }
        notifyListeners()
      })
    }
  } catch (err) {
    console.warn('[Auth] initAuth error:', err)
    currentAuthState = {
      user: null,
      agency: null,
      member: null,
      isLoading: false,
      isAuthenticated: false
    }
  }

  notifyListeners()
  return currentAuthState
}

// Sign in with email and password
export async function signInWithEmail(
  email: string,
  pass: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'החיבור ל-Supabase אינו מוגדר.' }
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (data.user) {
      const { agency, member } = await resolveUserAgency(data.user.id)
      currentAuthState = {
        user: data.user,
        agency,
        member,
        isLoading: false,
        isAuthenticated: true
      }
      notifyListeners()
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'שגיאה בהתחברות' }
  }
}

// Sign up with new agency or join existing agency via invite code
export async function signUpWithEmail(options: {
  email: string
  password: string
  fullName: string
  phone?: string
  agencyName?: string
  inviteCode?: string
}): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'החיבור ל-Supabase אינו מוגדר.' }
  }

  try {
    // If joining by invite code, verify invite code before creating user
    let targetAgency: Agency | null = null
    if (options.inviteCode) {
      const { data: foundAgency, error: codeErr } = await supabase
        .from('agencies')
        .select('*')
        .eq('invite_code', options.inviteCode.trim().toUpperCase())
        .maybeSingle()

      if (codeErr || !foundAgency) {
        return { success: false, error: 'קוד ההזמנה שגוי או שלא נמצאה סוכנות מתאימה.' }
      }
      targetAgency = foundAgency as Agency
    }

    const { data, error } = await supabase.auth.signUp({
      email: options.email.trim(),
      password: options.password,
      options: {
        data: {
          full_name: options.fullName,
          phone: options.phone || ''
        }
      }
    })

    if (error) {
      return { success: false, error: error.message }
    }

    const user = data.user
    if (!user) {
      return { success: false, error: 'לא התקבל משתמש לאחר ההרשמה.' }
    }

    // Link user to agency
    let agencyRecord: Agency | null = null
    let memberRole: 'owner' | 'agent' = 'agent'

    if (targetAgency) {
      agencyRecord = targetAgency
      memberRole = 'agent'
    } else {
      // Create new agency
      const agencyTitle = options.agencyName?.trim() || `${options.fullName} נדל״ן`
      const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      
      const { data: newAgency, error: createAgencyErr } = await supabase
        .from('agencies')
        .insert({
          name: agencyTitle,
          invite_code: randomCode
        })
        .select('*')
        .single()

      if (createAgencyErr) {
        console.warn('[Auth] Error creating agency:', createAgencyErr)
      } else {
        agencyRecord = newAgency as Agency
      }
      memberRole = 'owner'
    }

    if (agencyRecord) {
      const { data: memberData } = await supabase
        .from('agency_members')
        .insert({
          agency_id: agencyRecord.id,
          user_id: user.id,
          role: memberRole
        })
        .select('*')
        .single()

      currentAuthState = {
        user,
        agency: agencyRecord,
        member: memberData as AgencyMember,
        isLoading: false,
        isAuthenticated: true
      }
      notifyListeners()
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'שגיאה בהרשמה' }
  }
}

// Sign out
export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured) return

  try {
    await supabase.auth.signOut()
    currentAuthState = {
      user: null,
      agency: null,
      member: null,
      isLoading: false,
      isAuthenticated: false
    }
    notifyListeners()

    // Optional: clear local session storage cache
    localStorage.removeItem('realtor_current_agency')
  } catch (err) {
    console.warn('[Auth] Sign out error:', err)
  }
}
