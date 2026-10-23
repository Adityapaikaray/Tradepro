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
  getSupabaseConfigurationError,
  supabaseUrl,
  supabasePublishableKey,
} from '../lib/supabase.ts';
import { supabaseUrl } from '../lib/supabase.ts';

export type AuthErrorContext = 'send' | 'signin' | 'signup' | 'update';

export const normalizeAuthEmail = (email: string): string => email.trim().toLowerCase();

export const resolveAuthRedirectUrl = (origin?: string | null, fallbackUrl = ''): string => {
  if (!origin) return fallbackUrl.trim();
  try {
    return new URL('/', origin).toString();
  } catch {
    return '';
  }
};

export const validateAuthEmail = (email: string): string | null => {
  if (!email) return 'Enter your email address.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
  return null;
};

export const mapAuthError = (error: unknown, context: AuthErrorContext = 'signin'): string => {
  if (!error) return 'Something went wrong. Please try again.';

  const details = typeof error === 'object' && error !== null
    ? error as { code?: unknown; status?: unknown; name?: unknown }
    : {};
  const message = typeof error === 'string'
    ? error
    : error instanceof Error
      ? error.message
      : typeof error === 'object' && 'message' in error && typeof error.message === 'string'
        ? error.message
        : '';
  const lower = message.toLowerCase();
  const code = typeof details.code === 'string' ? details.code.toLowerCase() : '';
  const name = typeof details.name === 'string' ? details.name.toLowerCase() : '';
  const status = typeof details.status === 'number' ? details.status : undefined;

  if (lower.includes('redirect') && (lower.includes('allow') || lower.includes('not permitted') || lower.includes('invalid'))) {
    return 'Supabase rejected this callback URL. Add the current app URL to Authentication → URL Configuration → Redirect URLs.';
  }
  if (code.includes('invalid_api_key') || lower.includes('invalid api key') || lower.includes('invalid api_key')) {
    return 'Supabase rejected the public API key. Check VITE_SUPABASE_PUBLISHABLE_KEY against the key in Project Settings → API.';
  }
  if (status === 404 || lower.includes('project not found') || lower.includes('no such project')) {
    return 'The Supabase project URL was not found. Check VITE_SUPABASE_URL in Project Settings → API.';
  }
  if (lower.includes('email_address_not_authorized') || lower.includes('email address not authorized')) {
    return 'Supabase Auth is not authorized to send to this address. Configure custom SMTP for external recipients.';
  }
  if (lower.includes('smtp') || lower.includes('error sending') || lower.includes('email provider')) {
    return 'Supabase could not send the email. Check the Auth email provider, SMTP settings, and email rate limits.';
  }
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
  if (
    name.includes('authretryablefetcherror') ||
    lower.includes('network') ||
    lower.includes('failed to fetch') ||
    lower.includes('fetcherror') ||
    lower.includes('networkerror') ||
    lower.includes('err_name_not_resolved') ||
    lower.includes('load failed') ||
    lower.includes('connection') ||
    lower.includes('cors') ||
    lower.includes('access-control')
  ) {
    const endpointHost = (() => {
      try { return new URL(supabaseUrl).host; } catch { return 'the configured Supabase project'; }
    })();
    return `TradePro could not reach Supabase Auth at ${endpointHost}. Verify VITE_SUPABASE_URL is the active project URL and that your network/browser can resolve and reach it.`;
  }
  if (lower.includes('invalid email') || lower.includes('email address')) {
    return 'Enter a valid email address.';
  }

  if (context === 'send') return 'Supabase could not send that email. Check the Auth email provider and SMTP settings, then try again.';
  if (context === 'signup') return 'Your account could not be created. Check your details and try again.';
  if (context === 'update') return 'Your password could not be updated. Request a new reset link and try again.';
  return 'Sign in failed. Check your details and try again.';
};
