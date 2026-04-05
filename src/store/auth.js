import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuth = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  authModal: null, // 'login' | 'register' | 'reset' | null

  setAuthModal: (v) => set({ authModal: v }),

  init: async () => {
    // Vérifier session existante
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      set({ user: session.user })
      await get().loadProfile(session.user.id)
    }
    set({ loading: false })

    // Écouter les changements d'auth
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        set({ user: session.user })
        await get().loadProfile(session.user.id)
      } else {
        set({ user: null, profile: null })
      }
    })
  },

  loadProfile: async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) set({ profile: data })
  },

  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  register: async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    })
    if (error) throw error
    // Update profile name
    if (data.user) {
      await supabase.from('profiles').update({ full_name: fullName }).eq('id', data.user.id)
    }
    return data
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) throw error
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },

  // Plan helpers
  isPro: () => {
    const { profile } = get()
    return profile?.plan === 'pro' || profile?.plan === 'premium'
  },
  isPremium: () => get().profile?.plan === 'premium',
  canUseFeature: (feature) => {
    const { profile } = get()
    const plan = profile?.plan || 'free'
    const features = {
      free: ['chart', 'watchlist_5', 'indicators_3', 'timeframes_basic'],
      pro: ['chart', 'watchlist_unlimited', 'indicators_unlimited', 'timeframes_all', 'alerts_10', 'ob_fvg', 'replay', 'export'],
      premium: ['chart', 'watchlist_unlimited', 'indicators_unlimited', 'timeframes_all', 'alerts_unlimited', 'ob_fvg', 'replay', 'export', 'ai_analysis', 'screener', 'live_room', 'journal'],
    }
    return features[plan]?.includes(feature) ?? false
  }
}))
