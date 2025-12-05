import { createClient } from '@supabase/supabase-js';

// Fix TS error: Property 'env' does not exist on type 'ImportMeta'
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key in .env file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);