import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export const useAuth = create((set, get) => ({
  user: null,
  profile: null,
  loading: false,
  authModal: null,

  setAuthModal: (v) => set({ authModal: v }),

  init: async () => {
    if (!isSupabaseConfigured) { set({ loading: false }); return }
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        set({ user: session.user })
        await get().loadProfile(session.user.id)
      }
    } catch (e) { console.warn('Auth init error:', e.message) }
    set({ loading: false })

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
    if (!isSupabaseConfigured) return
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (data) set({ profile: data })
    } catch (e) { console.warn('Profile load error:', e.message) }
  },

  login: async (email, password) => {
    if (!isSupabaseConfigured) throw new Error('Supabase non configuré — configure VITE_TV_SUPABASE_URL')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  register: async (email, password, fullName) => {
    if (!isSupabaseConfigured) throw new Error('Supabase non configuré — configure VITE_TV_SUPABASE_URL')
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
    if (error) throw error
    if (data.user) {
      try { await supabase.from('profiles').update({ full_name: fullName }).eq('id', data.user.id) } catch (e) {}
    }
    return data
  },

  resetPassword: async (email) => {
    if (!isSupabaseConfigured) throw new Error('Supabase non configuré')
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
    if (error) throw error
  },

  logout: async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut()
    set({ user: null, profile: null })
  },

  isPro: () => { const { profile } = get(); return profile?.plan === 'pro' || profile?.plan === 'premium' },
  isPremium: () => get().profile?.plan === 'premium',
  canUseFeature: (feature) => {
    const plan = get().profile?.plan || 'free'
    const features = {
      free: ['chart', 'watchlist_5', 'indicators_3'],
      pro: ['chart', 'watchlist_unlimited', 'indicators_unlimited', 'timeframes_all', 'alerts_10', 'ob_fvg', 'replay', 'export'],
      premium: ['chart', 'watchlist_unlimited', 'indicators_unlimited', 'timeframes_all', 'alerts_unlimited', 'ob_fvg', 'replay', 'export', 'ai_analysis', 'screener', 'live_room', 'journal'],
    }
    return features[plan]?.includes(feature) ?? false
  }
}))
