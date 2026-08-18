import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

/**
 * Checks whether Supabase environment variables have been configured.
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project.supabase.co');
};

if (!isSupabaseConfigured()) {
  console.warn(
    '[Credzo Finance] Supabase credentials not found in environment variables. ' +
    'Backend functionality will be enabled after configuring VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.'
  );
}

/**
 * Production-ready Supabase client instance with full TypeScript schema definitions.
 * Only the public anonymous key is used by the frontend; RLS policies protect database records.
 */
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
