import { createClient } from '@supabase/supabase-js';

// These should be set in your Vercel environment variables for deployment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be provided. Check your .env file or Vercel settings.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
