import { createClient } from '@supabase/supabase-js'

// Nouveau projet Supabase dédié Aureus Trading View
// À créer sur https://supabase.com → nouveau projet séparé d'Aureus Social Pro
const SUPABASE_URL = import.meta.env.VITE_TV_SUPABASE_URL || 'https://placeholder.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_TV_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ─── SQL migrations à exécuter dans Supabase SQL Editor ───────────────────
//
// -- Table profiles
// CREATE TABLE profiles (
//   id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
//   email TEXT NOT NULL,
//   full_name TEXT,
//   plan TEXT DEFAULT 'free' CHECK (plan IN ('free','pro','premium')),
//   stripe_customer_id TEXT,
//   stripe_subscription_id TEXT,
//   subscription_status TEXT DEFAULT 'inactive',
//   trial_ends_at TIMESTAMPTZ,
//   created_at TIMESTAMPTZ DEFAULT NOW(),
//   updated_at TIMESTAMPTZ DEFAULT NOW()
// );
// ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Users see own profile" ON profiles FOR ALL USING (auth.uid() = id);
//
// -- Table alerts
// CREATE TABLE alerts (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
//   symbol TEXT NOT NULL,
//   condition TEXT NOT NULL CHECK (condition IN ('above','below','cross_up','cross_down','ob_touch','fvg_touch')),
//   price NUMERIC,
//   indicator TEXT,
//   indicator_value NUMERIC,
//   message TEXT,
//   active BOOLEAN DEFAULT TRUE,
//   triggered_at TIMESTAMPTZ,
//   notify_email BOOLEAN DEFAULT TRUE,
//   notify_push BOOLEAN DEFAULT TRUE,
//   notify_telegram BOOLEAN DEFAULT FALSE,
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
// ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Users manage own alerts" ON alerts FOR ALL USING (auth.uid() = user_id);
//
// -- Table watchlists
// CREATE TABLE watchlists (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
//   symbols TEXT[] DEFAULT '{}',
//   updated_at TIMESTAMPTZ DEFAULT NOW()
// );
// ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Users manage own watchlist" ON watchlists FOR ALL USING (auth.uid() = user_id);
//
// -- Table layouts (templates sauvegardés)
// CREATE TABLE layouts (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
//   name TEXT NOT NULL,
//   config JSONB NOT NULL,
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
// ALTER TABLE layouts ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Users manage own layouts" ON layouts FOR ALL USING (auth.uid() = user_id);
//
// -- Trigger: create profile on signup
// CREATE OR REPLACE FUNCTION handle_new_user()
// RETURNS TRIGGER AS $$
// BEGIN
//   INSERT INTO profiles (id, email) VALUES (NEW.id, NEW.email);
//   RETURN NEW;
// END;
// $$ LANGUAGE plpgsql SECURITY DEFINER;
//
// CREATE TRIGGER on_auth_user_created
//   AFTER INSERT ON auth.users
//   FOR EACH ROW EXECUTE FUNCTION handle_new_user();
