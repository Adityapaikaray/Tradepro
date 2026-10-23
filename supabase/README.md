# TradePro Supabase Setup

## 1. Configure the active Supabase project

Copy the project URL and public publishable key from **Supabase Dashboard → Project Settings → API** into the local `.env` file and the production build environment:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

The legacy anon key is also accepted as `VITE_SUPABASE_ANON_KEY`. The project URL must belong to an active Supabase project and resolve from the user's browser. Do not use the service-role/secret key, database URL, or database password in frontend settings. `SUPABASE_*` server secrets are deliberately not exposed through Vite's client environment.

## 2. Configure Auth callback URLs

In **Supabase Dashboard → Authentication → URL Configuration**, set:

- **Site URL:** `https://tradepro.ai.studio/`
- **Redirect URLs:**
  - `https://tradepro.ai.studio/`
  - `http://localhost:3000/**` (local development; `server.ts` serves on port 3000)

The app passes its current origin to Supabase for email confirmation and password recovery. Add any other preview or custom domain explicitly to the redirect allow list before using it. Supabase uses the Site URL as the fallback and checks `redirectTo` against the allowed redirect URLs.

## 3. Enable password recovery email

In **Supabase Dashboard → Authentication → Providers → Email**, make sure Email is enabled. In **Authentication → Email Templates → Reset Password**, use `password_recovery_template.html` from this directory. The reset template must contain the `{{ .ConfirmationURL }}` link so it opens TradePro's recovery callback; the numeric-code template in `email_template.html` is for email verification and must not be used for password recovery.

For production delivery to users outside the Supabase organization, configure a custom SMTP provider under **Authentication → Settings → SMTP**. The built-in sender is restricted to authorized team addresses and has limited sending capacity. If email enumeration protection is enabled, the app intentionally shows a neutral success message whether or not the address belongs to an account.

## 4. Recovery flow

1. The user submits an email address. The app calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/' })`.
2. Supabase sends the reset email according to the project's Email Provider, template, redirect allow list, and SMTP settings.
3. The link returns to TradePro with a recovery session. The Supabase client detects the callback and the app opens its **Choose a new password** form.
4. The app saves the new password with `supabase.auth.updateUser({ password })`.

## 5. Database schema

If the project does not yet have the application's tables, run `schema.sql` from the Supabase SQL Editor. The user-owned tables use Row Level Security and the profile trigger populates `public.profiles` for new users.
