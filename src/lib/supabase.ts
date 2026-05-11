import { createClient } from '@supabase/supabase-js';

// These variables come from your Supabase integration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// We provide fallback strings to prevent the app from crashing during boot
// if the environment variables aren't loaded yet.
const finalUrl = supabaseUrl || 'https://placeholder-url.supabase.co';
const finalKey = supabaseAnonKey || 'placeholder-key';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing. Please ensure you've connected the database integration and RESTARTED the app.");
}

export const supabase = createClient(finalUrl, finalKey);