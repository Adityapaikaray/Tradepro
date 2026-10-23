/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, Moon, ShieldCheck, Sun, UserRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { getSupabaseConfigurationError } from '../lib/supabase.ts';
import { useNavigation } from '../contexts/NavigationContext.tsx';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { TradeProIcon } from './TradeProLogo.tsx';

type AuthMode = 'sign-in' | 'sign-up' | 'forgot-password' | 'verify-email' | 'reset-password';
type InitialMode = 'sign-in' | 'sign-up';

interface AuthScreenProps {
  initialMode?: InitialMode;
  isPasswordRecovery?: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ initialMode = 'sign-in', isPasswordRecovery = false }) => {
  const {
    isSupabaseActive,
    signIn,
    signUp,
    resendVerificationEmail,
    requestPasswordReset,
    updatePassword,
    logout,
  } = useAuth();
  const { navigate } = useNavigation();
  const { theme, toggleTheme } = useTheme();

  const [mode, setMode] = useState<AuthMode>(isPasswordRecovery ? 'reset-password' : initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const actionInProgress = useRef(false);

  useEffect(() => {
    if (isPasswordRecovery && !passwordUpdated) setMode('reset-password');
  }, [isPasswordRecovery, passwordUpdated]);

  useEffect(() => {
    const query = window.location.search.replace(/^\?/, '');
    const hash = window.location.hash.replace(/^#/, '');
    const callbackParams = new URLSearchParams(`${query}&${hash}`);
    const callbackError = callbackParams.get('error_code') || callbackParams.get('error');
    const callbackDescription = callbackParams.get('error_description') || '';
    if (!callbackError && !callbackDescription) return;

    const details = `${callbackError || ''} ${callbackDescription}`.toLowerCase();
    if (details.includes('expired') || details.includes('otp') || details.includes('invalid')) {
      setError('This authentication link has expired or is invalid. Request a fresh confirmation or password reset link and try again.');
    } else {
      setError('This authentication link could not be used. Request a fresh link and try again.');
    }
  }, []);

  useEffect(() => {
    if (!isPasswordRecovery) setMode(initialMode);
  }, [initialMode]);

  const changeMode = (nextMode: AuthMode) => {
    setError('');
    setNotice('');
    setMode(nextMode);
    if (nextMode === 'sign-in') navigate('login');
    if (nextMode === 'sign-up') navigate('signup');
  };

  const runAction = async (action: () => Promise<void>) => {
    if (actionInProgress.current) return;
    actionInProgress.current = true;
    setError('');
    setNotice('');
    setIsBusy(true);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong. Please try again.');
    } finally {
      actionInProgress.current = false;
      setIsBusy(false);
    }
  };

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      setError('Enter your email address.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return false;
    }
    return true;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (mode === 'verify-email') return;
    if (!validateEmail()) return;

    if (mode === 'sign-in') {
      if (!password) return setError('Enter your password.');
      void runAction(async () => {
        const result = await signIn(email, password);
        if (result.requiresEmailVerification) setMode('verify-email');
        if (!result.success) setError(result.error || 'Sign in failed. Check your details and try again.');
      });
      return;
    }

    if (mode === 'sign-up') {
      if (password.length < 8) return setError('Use a password with at least 8 characters.');
      if (password !== confirmPassword) return setError('The passwords do not match.');
      void runAction(async () => {
        const result = await signUp(email, password, fullName);
        if (!result.success) {
          setError(result.error || 'Your account could not be created. Please try again.');
          return;
        }
        if (result.requiresEmailVerification) setMode('verify-email');
        setNotice(result.message || 'Check your inbox for next steps.');
      });
      return;
    }

    if (mode === 'forgot-password') {
      void runAction(async () => {
        const result = await requestPasswordReset(email);
        if (!result.success) setError(result.error || 'We could not send a reset link. Please try again.');
        else setNotice(result.message || 'Check your inbox for a password reset link.');
      });
      return;
    }

    if (mode === 'reset-password') {
      if (password.length < 8) return setError('Use a password with at least 8 characters.');
      if (password !== confirmPassword) return setError('The passwords do not match.');
      void runAction(async () => {
        const result = await updatePassword(password);
        if (!result.success) {
          setError(result.error || 'Your password could not be updated. Request a new reset link and try again.');
          return;
        }
        setPasswordUpdated(true);
        setNotice(result.message || 'Your password has been updated.');
        setPassword('');
        setConfirmPassword('');
      });
    }
  };

  const handleResendVerification = () => {
    if (!validateEmail()) return;
    void runAction(async () => {
      const result = await resendVerificationEmail(email);
      if (!result.success) setError(result.error || 'We could not resend the confirmation email. Please try again.');
      else setNotice(result.message || 'If this address has a pending confirmation, a new email is on its way.');
    });
  };

  const handleContinueAfterPasswordReset = () => {
    void runAction(async () => {
      await logout();
      setPasswordUpdated(false);
      setMode('sign-in');
      setError('');
      setNotice('Your password is updated. Sign in with the new password.');
      navigate('login');
    });
  };

  const title = passwordUpdated
    ? 'Password updated'
    : mode === 'sign-in'
      ? 'Welcome back'
      : mode === 'sign-up'
        ? 'Create your account'
        : mode === 'forgot-password'
          ? 'Reset your password'
          : mode === 'verify-email'
            ? 'Check your email'
            : 'Choose a new password';

  const description = passwordUpdated
    ? 'Your new password is ready to use.'
    : mode === 'sign-in'
      ? 'Sign in to continue to your TradePro workstation.'
      : mode === 'sign-up'
        ? 'Create an account to access your TradePro workstation.'
        : mode === 'forgot-password'
          ? 'We will email you a secure link to choose a new password.'
          : mode === 'verify-email'
            ? 'Verify your address before signing in. If you cannot find the original email, request a new confirmation below.'
            : 'Enter and confirm a new password for your account.';

  const showPasswordFields = !passwordUpdated && mode !== 'verify-email' && mode !== 'forgot-password';

  return (
    <main className="min-h-screen bg-ui-bg text-text-main flex items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-[440px]">
        <div className="mb-7 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('about')}
            className="flex items-center gap-3 rounded-xl text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            aria-label="Go to TradePro public pages"
          >
            <TradeProIcon size={42} />
            <span>
              <span className="block text-lg font-extrabold tracking-tight">TradePro</span>
              <span className="block text-[10px] font-bold tracking-[0.18em] text-text-muted">TRADE. ANALYZE. GROW.</span>
            </span>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="h-10 w-10 rounded-xl border border-ui-border bg-ui-surface flex items-center justify-center text-text-muted hover:text-primary transition-colors"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>

        <section className="rounded-3xl border border-ui-border bg-ui-surface p-6 shadow-2xl shadow-black/5 sm:p-8">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            {passwordUpdated ? <CheckCircle2 size={22} /> : mode === 'verify-email' ? <Mail size={21} /> : <ShieldCheck size={21} />}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-[28px]">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-text-muted">{description}</p>

          {!isSupabaseActive && (
            <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm leading-5 text-amber-700 dark:text-amber-300" role="status">
              {getSupabaseConfigurationError() || 'Email sign-in is unavailable until Supabase is configured for this deployment.'}
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm leading-5 text-rose-600 dark:text-rose-300" role="alert">
              {error}
            </div>
          )}
          {notice && (
            <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm leading-5 text-emerald-700 dark:text-emerald-300" role="status">
              {notice}
            </div>
          )}

          {passwordUpdated ? (
            <button
              type="button"
              onClick={handleContinueAfterPasswordReset}
              disabled={isBusy}
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-ui-bg transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBusy ? 'Signing out…' : 'Back to sign in'} <ArrowRight size={16} />
            </button>
          ) : mode === 'verify-email' ? (
            <div className="mt-7 space-y-3">
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isBusy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-ui-bg transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isBusy ? 'Sending…' : 'Resend confirmation email'} <ArrowRight size={16} />
              </button>
              <button type="button" onClick={() => changeMode('sign-in')} className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-text-muted hover:bg-ui-surface-hover hover:text-text-main transition-colors">
                <ArrowLeft size={15} className="mr-1 inline" /> Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
              {mode === 'sign-up' && (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-text-muted">Full name <span className="font-medium">(optional)</span></span>
                  <span className="relative block">
                    <UserRound size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      value={fullName}
                      onChange={event => setFullName(event.target.value)}
                      autoComplete="name"
                      className="w-full rounded-xl border border-ui-border bg-ui-bg py-3 pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="Your name"
                    />
                  </span>
                </label>
              )}

              {mode !== 'reset-password' && (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-text-muted">Email address</span>
                  <span className="relative block">
                    <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="email"
                      value={email}
                      onChange={event => setEmail(event.target.value)}
                      autoComplete="email"
                      inputMode="email"
                      required
                      className="w-full rounded-xl border border-ui-border bg-ui-bg py-3 pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="you@example.com"
                    />
                  </span>
                </label>
              )}

              {showPasswordFields && (
                <>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-text-muted">{mode === 'reset-password' ? 'New password' : 'Password'}</span>
                    <span className="relative block">
                      <LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={event => setPassword(event.target.value)}
                        autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                        required
                        minLength={8}
                        className="w-full rounded-xl border border-ui-border bg-ui-bg py-3 pl-10 pr-11 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        placeholder={mode === 'sign-in' ? 'Your password' : 'At least 8 characters'}
                      />
                      <button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-main" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </span>
                  </label>
                  {(mode === 'sign-up' || mode === 'reset-password') && (
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-text-muted">Confirm password</span>
                      <span className="relative block">
                        <LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={event => setConfirmPassword(event.target.value)}
                          autoComplete="new-password"
                          required
                          minLength={8}
                          className="w-full rounded-xl border border-ui-border bg-ui-bg py-3 pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                          placeholder="Enter the password again"
                        />
                      </span>
                    </label>
                  )}
                </>
              )}

              {mode === 'sign-in' && (
                <div className="-mt-1 flex justify-end">
                  <button type="button" onClick={() => changeMode('forgot-password')} className="text-xs font-bold text-primary hover:text-primary-light transition-colors">
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isBusy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-ui-bg transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isBusy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : mode === 'sign-up' ? 'Create account' : mode === 'forgot-password' ? 'Send reset link' : 'Update password'}
                {!isBusy && <ArrowRight size={16} />}
              </button>
            </form>
          )}

          {!passwordUpdated && mode !== 'verify-email' && (
            <div className="mt-6 border-t border-ui-border pt-5 text-center text-sm text-text-muted">
              {mode === 'sign-in' ? (
                <>New to TradePro? <button type="button" onClick={() => changeMode('sign-up')} className="font-bold text-primary hover:text-primary-light">Create an account</button></>
              ) : mode === 'sign-up' ? (
                <>Already have an account? <button type="button" onClick={() => changeMode('sign-in')} className="font-bold text-primary hover:text-primary-light">Sign in</button></>
              ) : (
                <button type="button" onClick={() => changeMode('sign-in')} className="inline-flex items-center gap-1 font-bold text-primary hover:text-primary-light">
                  <ArrowLeft size={14} /> Back to sign in
                </button>
              )}
            </div>
          )}
        </section>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-text-muted">
          <ShieldCheck size={13} /> Your password and session are managed by Supabase Auth.
        </p>
      </div>
    </main>
  );
};

export default AuthScreen;
