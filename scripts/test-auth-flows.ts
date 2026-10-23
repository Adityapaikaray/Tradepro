/**
 * Local auth helper checks. These validate UI input/error handling without
 * sending real verification or password-reset emails to the configured project.
 */

import { mapAuthError, normalizeAuthEmail, validateAuthEmail } from '../src/services/supabase.ts';

const cases: Array<{ name: string; passed: boolean }> = [
  {
    name: 'Email input is trimmed and lowercased',
    passed: normalizeAuthEmail('  Trader@Example.com ') === 'trader@example.com',
  },
  {
    name: 'Email validation rejects an empty value',
    passed: validateAuthEmail('') === 'Enter your email address.',
  },
  {
    name: 'Email validation rejects malformed addresses',
    passed: validateAuthEmail('not-an-email') === 'Enter a valid email address.',
  },
  {
    name: 'Email validation accepts a normal address',
    passed: validateAuthEmail('trader@example.com') === null,
  },
  {
    name: 'Invalid password credentials produce a useful sign-in message',
    passed: mapAuthError({ message: 'Invalid login credentials' }, 'signin') === 'Email or password is incorrect.',
  },
  {
    name: 'Unconfirmed email produces a verification prompt',
    passed: mapAuthError({ code: 'email_not_confirmed', message: 'Email not confirmed' }, 'signin').includes('Verify your email'),
  },
  {
    name: 'Email throttling produces a retry message',
    passed: mapAuthError({ message: 'over_email_send_rate_limit' }, 'send').includes('Too many attempts'),
  },
  {
    name: 'Network failures produce a connection message',
    passed: mapAuthError({ message: 'Failed to fetch' }, 'send').includes('Check your connection'),
  },
  {
    name: 'Password update failures explain the reset-link requirement',
    passed: mapAuthError({ message: 'Unexpected provider failure' }, 'update').includes('password could not be updated'),
  },
];

let failures = 0;
for (const testCase of cases) {
  if (testCase.passed) {
    console.log(`[PASS] ${testCase.name}`);
  } else {
    failures += 1;
    console.error(`[FAIL] ${testCase.name}`);
  }
}

console.log(`\n${cases.length - failures}/${cases.length} auth helper checks passed.`);
if (failures > 0) process.exitCode = 1;
