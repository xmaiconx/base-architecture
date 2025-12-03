import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { api } from '@/lib/api';

/**
 * useSupabaseAuth Hook
 *
 * Manages authentication state using Supabase Auth SDK.
 * Syncs Supabase session with application auth store.
 *
 * Features:
 * - Email/password sign up and sign in
 * - OAuth (Google) sign in
 * - Password recovery and reset
 * - Session management and auto-refresh
 * - Logout and session cleanup
 *
 * Flow:
 * 1. Frontend calls Supabase Auth API directly
 * 2. Supabase creates user in auth.users
 * 3. Webhook triggers backend to create Account/Workspace/User
 * 4. Frontend stores session and uses access_token for backend API calls
 */

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface UpdatePasswordData {
  password: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
}

export const useSupabaseAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  // Initialize auth state from Supabase session
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Failed to get session:', error);
        setAuthState((prev) => ({ ...prev, error, loading: false }));
        return;
      }

      if (session) {
        syncAuthState(session);
      } else {
        setAuthState((prev) => ({ ...prev, loading: false }));
      }
    });

    // Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);

      if (session) {
        await syncAuthState(session);
      } else {
        clearAuth();
        setAuthState({
          user: null,
          session: null,
          loading: false,
          error: null,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Sync Supabase session with application auth store
   *
   * Fetches user profile from backend /auth/me endpoint
   * and stores it along with the Supabase access token
   */
  const syncAuthState = async (session: Session) => {
    try {
      // Fetch application user profile from backend
      const response = await api.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const { user: appUser } = response.data;

      // Update auth store with application user data
      setAuth(
        {
          id: appUser.id,
          email: appUser.email,
          name: appUser.fullName,
          accountId: appUser.accountId,
        },
        session.access_token
      );

      // Update local auth state
      setAuthState({
        user: session.user,
        session,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Failed to sync auth state:', error);
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: error as AuthError,
      }));
    }
  };

  /**
   * Sign up with email and password
   *
   * Creates user in Supabase auth.users table
   * Sends confirmation email automatically
   * Webhook will trigger backend to create Account/Workspace/User
   */
  const signUp = async (data: SignUpData) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }));

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
        },
      },
    });

    if (error) {
      setAuthState((prev) => ({ ...prev, loading: false, error }));
      throw error;
    }

    setAuthState((prev) => ({ ...prev, loading: false }));
    return authData;
  };

  /**
   * Sign in with email and password
   *
   * Authenticates user against Supabase auth.users
   * Returns session with access_token for backend API calls
   */
  const signIn = async (data: SignInData) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }));

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setAuthState((prev) => ({ ...prev, loading: false, error }));
      throw error;
    }

    // syncAuthState is called automatically by onAuthStateChange
    return authData;
  };

  /**
   * Sign in with Google OAuth
   *
   * Redirects to Google OAuth consent screen
   * On success, redirects back to application with session
   */
  const signInWithGoogle = async () => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }));

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setAuthState((prev) => ({ ...prev, loading: false, error }));
      throw error;
    }

    return data;
  };

  /**
   * Sign out
   *
   * Clears Supabase session and application auth store
   */
  const signOut = async () => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }));

    const { error } = await supabase.auth.signOut();

    if (error) {
      setAuthState((prev) => ({ ...prev, loading: false, error }));
      throw error;
    }

    clearAuth();
    setAuthState({
      user: null,
      session: null,
      loading: false,
      error: null,
    });
  };

  /**
   * Send password recovery email
   *
   * Supabase sends magic link to email for password reset
   */
  const resetPassword = async (data: ResetPasswordData) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }));

    const { data: authData, error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    if (error) {
      setAuthState((prev) => ({ ...prev, loading: false, error }));
      throw error;
    }

    setAuthState((prev) => ({ ...prev, loading: false }));
    return authData;
  };

  /**
   * Update password (after clicking magic link from email)
   *
   * Must be called from password reset callback page
   */
  const updatePassword = async (data: UpdatePasswordData) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }));

    const { data: authData, error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      setAuthState((prev) => ({ ...prev, loading: false, error }));
      throw error;
    }

    setAuthState((prev) => ({ ...prev, loading: false }));
    return authData;
  };

  /**
   * Resend confirmation email
   *
   * Proxies to backend which calls Supabase Admin API
   */
  const resendConfirmation = async (email: string) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await api.post('/auth/resend-confirmation', { email });
      setAuthState((prev) => ({ ...prev, loading: false }));
    } catch (error) {
      setAuthState((prev) => ({ ...prev, loading: false, error: error as AuthError }));
      throw error;
    }
  };

  return {
    // State
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    error: authState.error,
    isAuthenticated: !!authState.session,

    // Methods
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
    resendConfirmation,
  };
};
