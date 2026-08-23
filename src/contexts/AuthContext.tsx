import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile } from '../types/database';

export interface SignInResult {
  error: AuthError | Error | null;
  isLocked?: boolean;
  remainingSeconds?: number;
  failedAttempts?: number;
  remainingAttempts?: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<SignInResult>;
  resetPasswordForEmail: (email: string) => Promise<{ error: AuthError | Error | null }>;
  updateUserPassword: (password: string) => Promise<{ error: AuthError | Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch profile matching authenticated user ID
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    if (!isSupabaseConfigured()) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[Credzo Finance] Error fetching profile:', error);
        return null;
      }

      return data as Profile | null;
    } catch (err) {
      console.warn('[Credzo Finance] Failed to fetch user profile:', err);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      const userProfile = await fetchProfile(user.id);
      setProfile(userProfile);
    }
  };

  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // 1. Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user?.id) {
        const userProfile = await fetchProfile(session.user.id);
        if (isMounted) {
          setProfile(userProfile);
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    });

    // 2. Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!isMounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user?.id) {
          const userProfile = await fetchProfile(newSession.user.id);
          if (isMounted) {
            setProfile(userProfile);
          }
        } else {
          if (isMounted) {
            setProfile(null);
          }
        }

        if (isMounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return {
        error: new Error(
          'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your environment variables.'
        ),
      };
    }

    const trimmedEmail = email.trim();

    try {
      // 1. Authenticate via secure server-side Edge Function gateway
      // Enforces 5 failed attempts -> 15 minute server-side lockout
      const { data, error } = await supabase.functions.invoke('staff-login', {
        body: {
          email: trimmedEmail,
          password,
        },
      });

      if (error) {
        let errorBody: {
          is_locked?: boolean;
          remaining_seconds?: number;
          failed_attempts?: number;
          remaining_attempts?: number;
          error?: string;
        } | null = null;

        // In @supabase/functions-js, error.context is the parsed JSON body or a Response
        if (error.context && typeof error.context === 'object') {
          if ('json' in error.context && typeof error.context.json === 'function') {
            try {
              errorBody = await error.context.clone().json();
            } catch {
              // fallback
            }
          } else {
            errorBody = error.context as typeof errorBody;
          }
        } else if (typeof error.context === 'string') {
          try {
            errorBody = JSON.parse(error.context);
          } catch {
            // fallback
          }
        }

        const isLocked = Boolean(errorBody?.is_locked || (data && typeof data === 'object' && 'is_locked' in data && (data as any).is_locked));
        const remainingSecs = Number(errorBody?.remaining_seconds ?? (data && typeof data === 'object' && 'remaining_seconds' in data ? (data as any).remaining_seconds : undefined)) || 0;
        const failedAttempts = Number(errorBody?.failed_attempts ?? (data && typeof data === 'object' && 'failed_attempts' in data ? (data as any).failed_attempts : undefined)) || 0;
        const remainingAttempts = errorBody?.remaining_attempts !== undefined
          ? Number(errorBody.remaining_attempts)
          : (data && typeof data === 'object' && 'remaining_attempts' in data ? Number((data as any).remaining_attempts) : (failedAttempts > 0 ? Math.max(0, 5 - failedAttempts) : undefined));

        if (isLocked) {
          return {
            error: new Error('TOO_MANY_ATTEMPTS'),
            isLocked: true,
            remainingSeconds: remainingSecs || 900,
            failedAttempts: failedAttempts || 5,
            remainingAttempts: 0,
          };
        }

        const msg =
          errorBody?.error ||
          (error.message && !error.message.includes('non-2xx') && !error.message.includes('Edge Function')
            ? error.message
            : 'Invalid email or password. Please check your credentials.');

        return {
          error: new Error(msg),
          isLocked: false,
          remainingSeconds: 0,
          failedAttempts,
          remainingAttempts,
        };
      }

      // Check if Edge Function returned an error payload with 200 status
      if (data?.error) {
        const isLocked = Boolean(data.is_locked);
        const remainingSecs = Number(data.remaining_seconds) || 0;
        const failedAttempts = Number(data.failed_attempts) || 0;
        const remainingAttempts = data.remaining_attempts !== undefined
          ? Number(data.remaining_attempts)
          : (failedAttempts > 0 ? Math.max(0, 5 - failedAttempts) : undefined);

        if (isLocked) {
          return {
            error: new Error('TOO_MANY_ATTEMPTS'),
            isLocked: true,
            remainingSeconds: remainingSecs || 900,
            failedAttempts: failedAttempts || 5,
            remainingAttempts: 0,
          };
        }
        return {
          error: new Error(String(data.error)),
          isLocked: false,
          remainingSeconds: 0,
          failedAttempts,
          remainingAttempts,
        };
      }

      if (!data?.session) {
        return {
          error: new Error('Authentication failed. No active session returned from server.'),
        };
      }

      // 2. Establish client-side Supabase session with the returned verified tokens
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      if (sessionError) {
        return { error: sessionError };
      }

      setSession(sessionData.session);
      setUser(sessionData.user);

      if (sessionData.user?.id) {
        const userProfile = await fetchProfile(sessionData.user.id);
        setProfile(userProfile);
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const resetPasswordForEmail = async (email: string) => {
    if (!isSupabaseConfigured()) {
      return {
        error: new Error(
          'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your environment variables.'
        ),
      };
    }

    try {
      const redirectTo = `${window.location.origin}/admin/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const updateUserPassword = async (password: string) => {
    if (!isSupabaseConfigured()) {
      return {
        error: new Error(
          'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your environment variables.'
        ),
      };
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        return { error };
      }
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[Credzo Finance] Sign out error:', err);
      }
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signInWithEmail,
        resetPasswordForEmail,
        updateUserPassword,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
