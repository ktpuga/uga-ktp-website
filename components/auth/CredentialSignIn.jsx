'use client';

// Our own sign-in form, drawn from Authentik's flow challenges.
//
// Replaces the "Sign in with KTP SSO" button for a visitor with no Authentik
// session. The silent probe still runs first (see app/login/page.jsx), so a
// member who already has one is signed in without ever seeing this.
//
// THE SHAPE OF THE THING, because it is not obvious from the code alone:
//
//   1. This component drives Authentik's flow executor over fetch. Username and
//      password go to auth.ugaktp.com directly; they never touch our server.
//   2. When the flow reaches its terminal redirect, the browser is holding a
//      real Authentik session cookie.
//   3. We then start an ORDINARY next-auth sign-in, which redirects to the
//      OIDC authorize endpoint, finds that session, and completes with no
//      interaction.
//
// So this never handles a token either. It establishes a session and gets out
// of the way. Everything downstream — /auth/redirect, the portal routing, the
// profile_complete gate — is untouched and does not know this exists.
//
// Deliberately a FULL signIn at step 3 rather than prompt=none: a brand new
// account still has to grant first consent, and prompt=none cannot do that.
// That is the same bug that shipped in the original probe; see
// lib/sso.js and the /auth/start entry point.

import { useCallback, useEffect, useRef, useState } from 'react';
import { signIn } from 'next-auth/react';
import { clearProbeMark } from '@/lib/sso';
import {
  HANDLED_COMPONENTS,
  fallbackUrl,
  fieldErrors,
  formError,
  getChallenge,
  submitChallenge,
} from '@/lib/authentik-flow';

const inputClass =
  'w-full rounded-md border border-white/25 bg-white/10 px-3 py-3 text-white placeholder-white/40 ' +
  'focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/30';

const buttonClass =
  'w-full rounded-md bg-[#2A5CCA] py-3 font-semibold uppercase tracking-wider text-white ' +
  'shadow-lg transition-colors hover:bg-[#3570DB] disabled:cursor-not-allowed disabled:opacity-60';

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-200">{message}</p>;
}

export default function CredentialSignIn({ origin, slug = 'default-authentication-flow' }) {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // The flow has finished and a navigation is in flight. STATE, not the ref
  // below, because this drives what renders — a ref change doesn't re-render,
  // so the form would stay on screen underneath the redirect.
  const [terminal, setTerminal] = useState(null); // 'handoff' | 'finishing'

  // Guards the terminal navigation, and is only ever touched inside callbacks.
  // A ref rather than the state above because the guard has to be SYNCHRONOUS:
  // two submits in the same tick would both read a stale `terminal` and fire
  // two navigations, and the second would race the first.
  const completing = useRef(false);

  // Anything we can't draw goes to Authentik's own page rather than leaving
  // someone stuck. Covers an unknown stage type, a CORS failure and a 5xx
  // alike — in every one of those cases the page this replaced still works.
  const handOff = useCallback(() => {
    if (completing.current) return;
    completing.current = true;
    setTerminal('handoff');
    window.location.href = fallbackUrl(origin, slug);
  }, [origin, slug]);

  // The flow is done and the browser now holds an Authentik session. Hand over
  // to next-auth, which will find it and complete silently.
  const finish = useCallback(() => {
    if (completing.current) return;
    completing.current = true;
    setTerminal('finishing');
    // A deliberate credential submit, so any later failure is real and must be
    // reported rather than suppressed as "the probe found nobody".
    clearProbeMark();
    signIn('authentik', { callbackUrl: '/auth/redirect' });
  }, []);

  const apply = useCallback(
    (result) => {
      if (result.handoff) return handOff();

      const next = result.challenge;
      if (!next?.component) return handOff();
      if (next.component === 'xak-flow-redirect') return finish();
      if (!HANDLED_COMPONENTS.has(next.component)) return handOff();

      setChallenge(next);
    },
    [finish, handOff]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await getChallenge(origin, slug);
      if (cancelled) return;
      setLoading(false);
      apply(result);
    })();
    return () => {
      cancelled = true;
    };
  }, [apply, origin, slug]);

  async function onSubmit(event) {
    event.preventDefault();
    if (submitting || completing.current) return;

    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());

    setSubmitting(true);
    const result = await submitChallenge(origin, slug, body);
    setSubmitting(false);
    apply(result);
  }

  if (loading || terminal) {
    return (
      <p className="text-center text-sm text-white/60" role="status">
        {terminal === 'handoff' ? 'Taking you to the sign-in page…' : 'One moment…'}
      </p>
    );
  }

  if (!challenge) return null;

  const errors = fieldErrors(challenge);
  const banner = formError(challenge);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {banner && (
        <p className="rounded-md border border-red-300/40 bg-red-500/15 px-4 py-3 text-sm text-white">
          {banner}
        </p>
      )}

      {challenge.component === 'ak-stage-identification' && (
        <>
          <div>
            <label htmlFor="uid_field" className="mb-1 block text-sm text-white/70">
              Username or email
            </label>
            <input
              id="uid_field"
              name="uid_field"
              type="text"
              autoComplete="username"
              autoFocus
              required
              className={inputClass}
            />
            <FieldError message={errors.uid_field} />
          </div>

          {/* Some identification stages collect the password in the same step.
              The challenge says which, and rendering both unconditionally
              would post a password field the stage never asked for. */}
          {challenge.password_fields && (
            <div>
              <label htmlFor="password" className="mb-1 block text-sm text-white/70">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={inputClass}
              />
              <FieldError message={errors.password} />
            </div>
          )}
        </>
      )}

      {challenge.component === 'ak-stage-password' && (
        <div>
          <label htmlFor="password" className="mb-1 block text-sm text-white/70">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            autoFocus
            required
            className={inputClass}
          />
          <FieldError message={errors.password} />
        </div>
      )}

      <button type="submit" disabled={submitting} className={buttonClass}>
        {submitting ? 'Signing in…' : (challenge.primary_action ?? 'Log in')}
      </button>

      {/* Authentik's own page, kept reachable on purpose. If this form ever
          misbehaves for someone, the thing it replaced is one click away
          rather than a support message. */}
      <p className="text-center">
        <a
          href={fallbackUrl(origin, slug)}
          className="text-xs text-white/50 underline hover:text-white/80"
        >
          Having trouble? Use the standard sign-in page
        </a>
      </p>
    </form>
  );
}
