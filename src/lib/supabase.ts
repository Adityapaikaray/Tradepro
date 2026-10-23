/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

type SupabaseEnvKey = 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_PUBLISHABLE_KEY' | 'VITE_SUPABASE_ANON_KEY';

// Read only the three public settings this client needs. Avoid dynamically
// indexing import.meta.env, which would make Vite include every VITE_* value
// in the client bundle.
const getEnvVar = (key: SupabaseEnvKey): string => {
  const viteValue = key === 'VITE_SUPABASE_URL'
    ? import.meta.env?.VITE_SUPABASE_URL
    : key === 'VITE_SUPABASE_PUBLISHABLE_KEY'
      ? import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY
      : import.meta.env?.VITE_SUPABASE_ANON_KEY;
  if (viteValue) return viteValue;

  if (typeof process === 'undefined' || !process.env) return '';
  return key === 'VITE_SUPABASE_URL'
    ? process.env.VITE_SUPABASE_URL || ''
    : key === 'VITE_SUPABASE_PUBLISHABLE_KEY'
      ? process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
      : process.env.VITE_SUPABASE_ANON_KEY || '';
};

const configuredSupabaseUrl = getEnvVar('VITE_SUPABASE_URL').trim();
const configuredSupabaseKey = (
  getEnvVar('VITE_SUPABASE_PUBLISHABLE_KEY') ||
  getEnvVar('VITE_SUPABASE_ANON_KEY')
).trim();

// Keep module initialization safe when configuration is missing. Auth actions
// are guarded by isSupabaseConfigured(), so this reserved host is never used
// as a real project endpoint.
export const supabaseUrl = configuredSupabaseUrl || 'https://supabase-not-configured.invalid';
export const supabasePublishableKey = configuredSupabaseKey;

export const supabaseAnonKey: string = supabasePublishableKey;

const isValidSupabaseUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    const validProtocol = url.protocol === 'https:' || (
      url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
    );
    return validProtocol && !url.username && !url.password && !url.search && !url.hash;
  } catch {
    return false;
  }
};

const isServiceRoleKey = (value: string): boolean => {
  if (value.startsWith('sb_secret_')) return true;
  const payload = value.split('.')[1];
  if (!payload || typeof globalThis.atob !== 'function') return false;

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const decoded = globalThis.atob(paddedBase64);
    return JSON.parse(decoded).role === 'service_role';
  } catch {
    return false;
  }
};

export const getSupabaseConfigurationError = (): string | null => {
  if (!configuredSupabaseUrl) {
    return 'Supabase is not configured for this deployment. Set VITE_SUPABASE_URL to the project URL from Supabase Project Settings → API.';
  }
  if (!isValidSupabaseUrl(configuredSupabaseUrl)) {
    return 'The configured Supabase URL is invalid. Use the HTTPS project URL from Supabase Project Settings → API.';
  }
  if (new URL(configuredSupabaseUrl).hostname.includes('your-project-ref')) {
    return 'Replace the Supabase URL placeholder with your active project URL from Project Settings → API.';
  }
  if (!configuredSupabaseKey) {
    return 'Supabase is missing its public key. Set VITE_SUPABASE_PUBLISHABLE_KEY to the project publishable key (or legacy anon key).';
  }
  if (configuredSupabaseKey.startsWith('your_') || configuredSupabaseKey.includes('placeholder')) {
    return 'Replace the Supabase key placeholder with the project publishable key (or legacy anon key).';
  }
  if (isServiceRoleKey(configuredSupabaseKey)) {
    return 'The Supabase key is a secret/service-role key. Replace it with the public publishable key; secret keys must never be used in the browser.';
  }
  return null;
};

export const isSupabaseConfigured = (): boolean => {
  return getSupabaseConfigurationError() === null;
};

/**
 * Single, canonical Supabase client instance initialized using
 * VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.
 * Configured with session persistence and auto-refresh for authentication use.
 */
export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey || 'sb-anon-key-placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'tradepro-supabase-auth',
    },
  }
);

export default supabase;
