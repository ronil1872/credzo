import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

// Resolve and sanitize URL from supported environment variable names
const rawSupabaseUrl = (
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_PUBLIC_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_PROJECT_URL ||
  ''
).trim();

// Resolve and sanitize public/anon key from supported environment variable names
const rawSupabasePublishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_KEY ||
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_PUBLIC_SUPABASE_KEY ||
  import.meta.env.VITE_SUPABASE_API_KEY ||
  ''
).trim();

const PLACEHOLDER_URLS = [
  'https://your-project.supabase.co',
  'https://placeholder.supabase.co',
  'your-project.supabase.co',
  'placeholder.supabase.co',
];

const PLACEHOLDER_KEYS = [
  'your-supabase-publishable-key',
  'your-supabase-anon-key',
  'placeholder-publishable-key',
  'placeholder-anon-key',
];

/**
 * Checks whether Supabase environment variables have been configured with valid non-placeholder values.
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    rawSupabaseUrl &&
    rawSupabasePublishableKey &&
    !PLACEHOLDER_URLS.includes(rawSupabaseUrl.toLowerCase()) &&
    !PLACEHOLDER_KEYS.includes(rawSupabasePublishableKey.toLowerCase()) &&
    rawSupabaseUrl.startsWith('https://')
  );
};

/**
 * Safe diagnostic status reporter (NEVER returns actual key or URL values).
 */
export const getSupabaseConfigStatus = () => {
  return {
    hasUrl: Boolean(rawSupabaseUrl && !PLACEHOLDER_URLS.includes(rawSupabaseUrl.toLowerCase())),
    hasKey: Boolean(rawSupabasePublishableKey && !PLACEHOLDER_KEYS.includes(rawSupabasePublishableKey.toLowerCase())),
    isConfigured: isSupabaseConfigured(),
  };
};

if (!isSupabaseConfigured()) {
  console.warn(
    '[Credzo Finance] Supabase credentials not found or unconfigured. ' +
    'Configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY).'
  );
}

/**
 * Frontend Supabase client.
 *
 * IMPORTANT:
 * Only the public publishable key is used in browser code.
 * Never use a secret/service_role key here.
 * Database security is enforced by Supabase RLS policies.
 */
export const supabase = createClient<Database>(
  rawSupabaseUrl || 'https://placeholder.supabase.co',
  rawSupabasePublishableKey || 'placeholder-publishable-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);