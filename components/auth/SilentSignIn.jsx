'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { markProbeStarted, clearEntryMarks, takeAutoSignInSlot } from '@/lib/sso';

// Asks Authentik "is this browser already signed in?" without showing anyone a
// login form, then either lets the redirect happen or reveals `children`.
//
// `prompt=none` is the OIDC way to ask that question: the IdP answers
// immediately — a code if there's a session, `error=login_required` if not —
// and never renders UI of its own. That's what lets a visitor with no account
// land on OUR page, where rush signup exists, instead of being dropped on
// Authentik's login form, where it doesn't.
//
// It is deliberately NOT the way a *deliberate* sign-in happens. `prompt=none`
// cannot grant first-time consent, so a brand-new account gets an error here
// even though its session is perfectly good — see components/auth/StartSignIn
// for the full sign-in used when we already know the visitor wants in.
//
// Every failure mode degrades to the manual button below, which is why the
// probe is safe to attempt at all.
export default function SilentSignIn({ enabled, children }) {
  const [probing, setProbing] = useState(enabled);

  useEffect(() => {
    // The server has now rendered its decision from the entry cookies, so
    // they've done their job — drop them before they can affect a later visit.
    if (!enabled) {
      clearEntryMarks();
      setProbing(false);
      return undefined;
    }

    if (!takeAutoSignInSlot()) {
      clearEntryMarks();
      setProbing(false);
      return undefined;
    }

    markProbeStarted();
    signIn('authentik', { callbackUrl: '/auth/redirect' }, { prompt: 'none' });

    // If the navigation hasn't happened by now something swallowed it. Show
    // the options rather than leaving a spinner forever — this is the login
    // path, so it must never be a dead end.
    const timer = setTimeout(() => {
      clearEntryMarks();
      setProbing(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, [enabled]);

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
