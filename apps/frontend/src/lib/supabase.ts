import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client Singleton
 *
 * Provides a single instance of the Supabase client for the entire application.
 * Uses the ANON key (safe to expose in frontend) for client-side operations.
 *
 * Authentication flow:
 * 1. Frontend calls supabase.auth.signUp() / signInWithPassword() / signInWithOAuth()
 * 2. Supabase Auth creates user in auth.users table
 * 3. Webhook triggers backend to create Account/Workspace/User
 * 4. Frontend stores session and uses access_token for API calls
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing environment variable: VITE_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('Missing environment variable: VITE_SUPABASE_ANON_KEY');
}

/**
 * Supabase client instance
 *
 * Auto-refresh enabled for seamless session management
 * Persist session in localStorage by default
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // Handle email confirmation callbacks
  },
});
