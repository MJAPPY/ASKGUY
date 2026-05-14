import { createClient } from "@supabase/supabase-js";

// These values are read from the Vite environment at build‑time.
// Make sure you have VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY defined
// in a .env file that is ignored by git.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fallback values keep the app from crashing during local development
const finalUrl = supabaseUrl || "https://placeholder.supabase.co";
const finalKey = supabaseAnonKey || "placeholder-anon-key";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials missing – add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file and restart the dev server."
  );
}

export const supabase = createClient(finalUrl, finalKey);