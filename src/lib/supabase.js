import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_TV_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_TV_SUPABASE_ANON_KEY

// Initialisation défensive — si pas de vraies clés Supabase, on utilise
// un client factice qui ne crashe pas l'app
const isConfigured = !!(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  SUPABASE_URL.startsWith('https://') &&
  SUPABASE_URL.includes('.supabase.co') &&
  SUPABASE_ANON_KEY.startsWith('eyJ')
)

// JWT valide au format correct mais factice (ne fait aucun appel réseau réel)
const MOCK_URL = 'https://aaaaaaaaaaaaaaaaaaaaaaaaaaaa.supabase.co'
const MOCK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.mock_signature_not_real'

export const supabase = createClient(
  isConfigured ? SUPABASE_URL : MOCK_URL,
  isConfigured ? SUPABASE_ANON_KEY : MOCK_KEY,
  {
    auth: { persistSession: isConfigured, autoRefreshToken: isConfigured },
    global: { fetch: isConfigured ? undefined : () => Promise.resolve(new Response('{}')) }
  }
)

export const isSupabaseConfigured = isConfigured
