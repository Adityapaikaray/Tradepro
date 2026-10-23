/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TradePro Server-Side Supabase Client / SSR Helpers
 * Utilizes @supabase/ssr and @supabase/supabase-js for secure server operations,
 * session cookies, and database profile interactions.
 */

import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Request, Response } from 'express';
import { supabaseUrl, supabaseAnonKey } from './supabase.ts';

/**
 * Creates a server-side Supabase client bound to Express req / res cookies.
 */
export function createExpressSupabaseClient(req: Request, res: Response) {
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey || 'sb-anon-key-placeholder',
    {
      cookies: {
        getAll() {
          const cookieHeader = req.headers.cookie ?? '';
          return parseCookieHeader(cookieHeader);
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const serialized = serializeCookieHeader(name, value, {
              ...options,
              sameSite: options.sameSite as any ?? 'lax',
              httpOnly: options.httpOnly ?? true,
              path: options.path ?? '/',
            });
            res.append('Set-Cookie', serialized);
          });
        },
      },
    }
  );
}

/**
 * Standard server-side Supabase client for standalone background tasks or Express middleware
 */
export const supabaseServer = createClient(
  supabaseUrl,
  supabaseAnonKey || 'sb-anon-key-placeholder',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
