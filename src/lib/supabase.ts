import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

/**
 * Checks whether Supabase environment variables have been configured.
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabasePublishableKey &&
    supabaseUrl !== 'https://your-project.supabase.co'
  );
};

if (!isSupabaseConfigured()) {
  console.warn(
    '[Credzo Finance] Supabase credentials not found. ' +
    'Configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.'
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
  supabaseUrl || 'https://placeholder.supabase.co',
  supabasePublishableKey || 'placeholder-publishable-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);