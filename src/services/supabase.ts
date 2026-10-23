/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared Supabase auth helpers. The application uses the single client created
 * in src/lib/supabase.ts; this module intentionally does not create a client.
 */

export {
  supabase,
  isSupabaseConfigured,
  supabaseUrl,
  supabasePublishableKey,
  SUPABASE_PROJECT_REF,
  SUPABASE_CANONICAL_URL,
} from '../lib/supabase.ts';

export type AuthErrorContext = 'send' | 'signin' | 'signup' | 'update';

export const normalizeAuthEmail = (email: string): string => email.trim().toLowerCase();

export const validateAuthEmail = (email: string): string | null => {
  if (!email) return 'Enter your email address.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
  return null;
};

export const mapAuthError = (error: unknown, context: AuthErrorContext = 'signin'): string => {
  if (!error) return 'Something went wrong. Please try again.';

  const message = typeof error === 'string'
    ? error
    : error instanceof Error
      ? error.message
      : typeof error === 'object' && 'message' in error && typeof error.message === 'string'
        ? error.message
        : '';
  const lower = message.toLowerCase();

  if (lower.includes('rate limit') || lower.includes('too many') || lower.includes('over_email_send_rate_limit')) {
    return 'Too many attempts. Wait a little while before trying again.';
  }
  if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials')) {
    return 'Email or password is incorrect.';
  }
  if (lower.includes('email not confirmed') || lower.includes('email_not_confirmed')) {
    return 'Verify your email address before signing in. You can resend the confirmation email.';
  }
  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return 'An account with this email may already exist. Try signing in or resetting your password.';
  }
  if (lower.includes('signups not allowed')) {
    return 'New account creation is currently disabled. Contact the site administrator.';
  }
  if (lower.includes('password should be at least') || lower.includes('password is too short')) {
    return 'Choose a longer password and try again.';
  }
  if (lower.includes('network') || lower.includes('failed to fetch') || lower.includes('fetcherror') || lower.includes('connection')) {
    return 'Could not reach the authentication service. Check your connection and try again.';
  }
  if (lower.includes('invalid email') || lower.includes('email address')) {
    return 'Enter a valid email address.';
  }

  if (context === 'send') return 'We could not send that email. Please try again shortly.';
  if (context === 'signup') return 'Your account could not be created. Check your details and try again.';
  if (context === 'update') return 'Your password could not be updated. Request a new reset link and try again.';
  return 'Sign in failed. Check your details and try again.';
};
