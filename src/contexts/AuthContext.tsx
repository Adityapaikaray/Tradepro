/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { getSupabaseConfigurationError, isSupabaseConfigured, supabase } from '../lib/supabase.ts';
import { mapAuthError, normalizeAuthEmail, resolveAuthRedirectUrl, validateAuthEmail } from '../services/supabase.ts';

export interface User {
  id: string;
  name: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  createdAt?: number;
}

export interface AuthActionResult {
  success: boolean;
  message?: string;
  error?: string;
  requiresEmailVerification?: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  isSupabaseActive: boolean;
  isPasswordRecovery: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<AuthActionResult>;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  resendVerificationEmail: (email: string) => Promise<AuthActionResult>;
  requestPasswordReset: (email: string) => Promise<AuthActionResult>;
  updatePassword: (password: string) => Promise<AuthActionResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getAuthRedirectUrl = (): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
  return resolveAuthRedirectUrl(origin, import.meta.env.VITE_AUTH_REDIRECT_URL?.trim() || '');
};

const hasVerifiedEmail = (user: SupabaseUser | null | undefined): boolean =>
  Boolean(user?.email_confirmed_at || user?.confirmed_at);

const toAppUser = (user: SupabaseUser | null | undefined): User | null => {
  if (!user?.email) return null;
  const metadataName = user.user_metadata?.full_name || user.user_metadata?.name;
  const displayName = typeof metadataName === 'string' && metadataName.trim()
    ? metadataName.trim()
    : user.email.split('@')[0];

  return {
    id: user.id,
    name: displayName,
    displayName,
    email: user.email,
    emailVerified: hasVerifiedEmail(user),
    createdAt: user.created_at ? new Date(user.created_at).getTime() : undefined,
  };
};

const configurationError = (): string => getSupabaseConfigurationError() ||
  'Supabase email authentication is not configured for this deployment.';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const authEventVersion = useRef(0);
  const isSupabaseActive = isSupabaseConfigured();

  useEffect(() => {
    let isMounted = true;
    const hasRecoveryCallback = typeof window !== 'undefined' &&
      new URLSearchParams(window.location.hash.replace(/^#/, '')).get('type') === 'recovery';
    if (hasRecoveryCallback) setIsPasswordRecovery(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!isMounted) return;
      authEventVersion.current += 1;
      setSession(nextSession);
      setLoading(false);

      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true);
      if (event === 'SIGNED_OUT') setIsPasswordRecovery(false);
    });

    const initialEventVersion = authEventVersion.current;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted || authEventVersion.current !== initialEventVersion) return;
      if (error) console.error('[Supabase Auth] Failed to restore session:', error.message);
      setSession(data.session);
      setLoading(false);
    }).catch((error: unknown) => {
      if (!isMounted) return;
      console.error('[Supabase Auth] Failed to restore session:', error);
      setSession(null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string): Promise<AuthActionResult> => {
    const cleanEmail = normalizeAuthEmail(email);
    const emailError = validateAuthEmail(cleanEmail);
    if (emailError) return { success: false, error: emailError };
    if (!password) return { success: false, error: 'Enter a password to create your account.' };
    if (!isSupabaseConfigured()) return { success: false, error: configurationError() };

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: getAuthRedirectUrl(),
        },
      });
      if (error) return { success: false, error: mapAuthError(error, 'signup') };

      const emailVerified = hasVerifiedEmail(data.user);
      return {
        success: true,
        requiresEmailVerification: !emailVerified,
        message: emailVerified
          ? 'Your account is ready.'
          : 'Check your inbox for a confirmation link. You can sign in after you verify your email.',
      };
    } catch (error) {
      return { success: false, error: mapAuthError(error, 'signup') };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthActionResult> => {
    const cleanEmail = normalizeAuthEmail(email);
    const emailError = validateAuthEmail(cleanEmail);
    if (emailError) return { success: false, error: emailError };
    if (!password) return { success: false, error: 'Enter your password.' };
    if (!isSupabaseConfigured()) return { success: false, error: configurationError() };

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) {
        const requiresEmailVerification = error.code === 'email_not_confirmed' ||
          error.message.toLowerCase().includes('email not confirmed');
        return {
          success: false,
          requiresEmailVerification,
          error: mapAuthError(error, 'signin'),
        };
      }
      if (!hasVerifiedEmail(data.user)) {
        await supabase.auth.signOut({ scope: 'local' });
        return {
          success: false,
          requiresEmailVerification: true,
          error: 'Verify your email address before signing in. You can resend the confirmation email below.',
        };
      }
      return { success: true, message: 'Signed in successfully.' };
    } catch (error) {
      return { success: false, error: mapAuthError(error, 'signin') };
    }
  }, []);

  const resendVerificationEmail = useCallback(async (email: string): Promise<AuthActionResult> => {
    const cleanEmail = normalizeAuthEmail(email);
    const emailError = validateAuthEmail(cleanEmail);
    if (emailError) return { success: false, error: emailError };
    if (!isSupabaseConfigured()) return { success: false, error: configurationError() };

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
        options: { emailRedirectTo: getAuthRedirectUrl() },
      });
      if (error) return { success: false, error: mapAuthError(error, 'send') };
      return { success: true, message: 'If this address has a pending confirmation, a new email is on its way.' };
    } catch (error) {
      return { success: false, error: mapAuthError(error, 'send') };
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string): Promise<AuthActionResult> => {
    const cleanEmail = normalizeAuthEmail(email);
    const emailError = validateAuthEmail(cleanEmail);
    if (emailError) return { success: false, error: emailError };
    if (!isSupabaseConfigured()) return { success: false, error: configurationError() };

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: getAuthRedirectUrl(),
      });
      if (error) return { success: false, error: mapAuthError(error, 'send') };
      return { success: true, message: 'If an account exists for this address, you will receive a password reset link shortly.' };
    } catch (error) {
      return { success: false, error: mapAuthError(error, 'send') };
    }
  }, []);

  const updatePassword = useCallback(async (password: string): Promise<AuthActionResult> => {
    if (!password) return { success: false, error: 'Enter a new password.' };
    if (!isSupabaseConfigured()) return { success: false, error: configurationError() };
    if (!isPasswordRecovery && !session) {
      return { success: false, error: 'This password reset link is no longer active. Request a new link and try again.' };
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return { success: false, error: mapAuthError(error, 'update') };
      return { success: true, message: 'Your password has been updated. Sign in with your new password to continue.' };
    } catch (error) {
      return { success: false, error: mapAuthError(error, 'update') };
    }
  }, [isPasswordRecovery, session]);

  const logout = useCallback(async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSession(null);
    setIsPasswordRecovery(false);
  }, []);

  const user = toAppUser(session?.user);
  const isAuthenticated = Boolean(session?.user && hasVerifiedEmail(session.user));

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      loading,
      isSupabaseActive,
      isPasswordRecovery,
      signUp,
      signIn,
      resendVerificationEmail,
      requestPasswordReset,
      updatePassword,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
