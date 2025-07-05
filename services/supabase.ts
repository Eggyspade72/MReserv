import { createClient } from '@supabase/supabase-js';
import type { Database } from './db_types';

// --- IMPORTANT SECURITY NOTE ---
// In a production environment, these keys should be stored securely as environment
// variables and accessed via a mechanism like `process.env.VITE_SUPABASE_URL`.
// Hardcoding keys in client-side code is insecure and is done here only as a
// fallback for the development environment.

// Attempt to read from environment variables first.
// The `(globalThis as any).process` is a safe way to check for `process.env` in different environments.
const supabaseUrlFromEnv = (globalThis as any).process?.env?.VITE_SUPABASE_URL;
const supabaseAnonKeyFromEnv = (globalThis as any).process?.env?.VITE_SUPABASE_ANON_KEY;

// Use environment variables if available, otherwise fall back to the provided keys for development.
const supabaseUrl = supabaseUrlFromEnv || "https://uluuyrokxopleouunrlu.supabase.co";
const supabaseAnonKey = supabaseAnonKeyFromEnv || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsdXV5cm9reG9wbGVvdXVucmx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1ODAxODAsImV4cCI6MjA2NzE1NjE4MH0.G7OSrVDNUO0BFux82kJJ3gkTPcpomXhW8155jeQ4Ydw";


if (!supabaseUrl || !supabaseAnonKey) {
  // This check is a safeguard. The application will fail to start if credentials are not found either in env vars or here.
  throw new Error("Supabase URL and anonymous key are missing. Please provide them in your environment variables.");
}

// The createClient function now accepts a generic for Database types.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
