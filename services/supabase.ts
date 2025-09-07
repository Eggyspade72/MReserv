import { createClient } from '@supabase/supabase-js';
import type { Database } from './db_types';

// Use process.env, which is populated by Vite's `define` config.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and anonymous key are missing. Check your .env file and vite.config.js 'define' section.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);