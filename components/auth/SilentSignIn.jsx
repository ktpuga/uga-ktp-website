'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { markProbeStarted, clearProbeMark } from '@/lib/sso-probe';

// When this tab last asked Authentik whether it has a session. The backstop
// against a probe that returns *without* an error param and starts over on
// arrival — ?error= catches the ordinary failure, this catches a loop.
//
// Time-boxed rather than once-per-tab: a loop re-enters within milliseconds,
// while a session expiring an hour later deserves a fresh probe. A permanent
// flag would silently turn auto-sign-in off for the rest of the tab's life.
const PROBE_KEY = 'ktp_sso_probed_at';
const PROBE_COOLDOWN_MS = 30_000;

// Asks Authentik "is this browser already signed in?" without showing anyone a
// login form, then either lets the redirect happen or reveals `children`.
//
// `prompt=none` is the OIDC way to ask that question: the IdP answers
// immediately — a code if there's a session, `error=login_required` if not —
// and never renders UI of its own. That's what lets a visitor with no account
// land on OUR page, where rush signup exists, instead of being dropped on
// Authentik's login form, where it doesn't.
//
// Members keep the one-click behaviour: they have a session, so the probe
// succeeds and they're in the portal before this paints anything meaningful.
// Every failure mode degrades to the old manual button, which is why the probe
// is safe to attempt at all.
export default function SilentSignIn({ children }) {
  const [probing, setProbing] = useState(true);

  useEffect(() => {
    // sessionStorage throws in some privacy modes. Treating that as "not yet
    // probed" is the safe direction: the worst case is one redirect to
    // Authentik, which returns with ?error= and is caught server-side.
    let lastProbedAt = 0;
    try {
      lastProbedAt = Number(sessionStorage.getItem(PROBE_KEY)) || 0;
    } catch {
      lastProbedAt = 0;
    }

    if (Date.now() - lastProbedAt < PROBE_COOLDOWN_MS) {
      clearProbeMark();
      setProbing(false);
      return undefined;
    }

    try {
      sessionStorage.setItem(PROBE_KEY, String(Date.now()));
    } catch {
      // Ignored — see above.
    }

    markProbeStarted();
    signIn('authentik', { callbackUrl: '/auth/redirect' }, { prompt: 'none' });

    // If the navigation hasn't happened by now something swallowed it. Show
    // the options rather than leaving a spinner forever — this is the login
    // path, so it must never be a dead end.
    const timer = setTimeout(() => {
      clearProbeMark();
      setProbing(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  if (!probing) return children;

  return (
    <div className="flex flex-col items-center gap-4 py-2" aria-live="polite">
      <div
        className="h-6 w-6 animate-spin rounded-full border-2 border-white/25 border-t-white"
        role="status"
        aria-label="Checking your KTP account"
      />
      <p className="text-sm text-white/70">Checking your KTP account…</p>
    </div>
  );
}
