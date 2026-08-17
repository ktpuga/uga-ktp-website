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

import { fieldErrors, formError } from '@/lib/authentik-flow';
import { useFlowExecutor } from './useFlowExecutor';
import { buttonClass, FieldError, inputClass } from './FlowFields';

export default function CredentialSignIn({ origin, slug = 'default-authentication-flow' }) {
  const { challenge, loading, submitting, terminal, submit, handOff } = useFlowExecutor({
    origin,
    slug,
  });

  function onSubmit(event) {
    event.preventDefault();
    submit(Object.fromEntries(new FormData(event.currentTarget).entries()));
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

      {/* The SSO button this form replaced, kept reachable on purpose. Same
          reasoning as handOff, and the same trap: this must be a signIn(), not
          a link to Authentik's flow page, or it strands people on Authentik's
          application library signed in to the wrong half of the system. */}
      <p className="text-center">
        <button
          type="button"
          onClick={handOff}
          className="text-xs text-white/50 underline hover:text-white/80"
        >
          Having trouble? Sign in the standard way
        </button>
      </p>
    </form>
  );
}
