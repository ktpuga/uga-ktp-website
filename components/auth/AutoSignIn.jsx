'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';

// Starts the SSO round-trip on arrival instead of waiting for a click.
//
// The button was always redundant for anyone who already had an Authentik
// session: the OIDC authorization request returns immediately with a code when
// the IdP has a session, so the whole hop is invisible. It only needed to be
// *initiated*. Someone with no Authentik session lands on Authentik's own
// login form instead, which is where they were going anyway.
//
// The page decides whether to render this — see app/login/page.jsx for the two
// cases where auto-start is suppressed, both of which would otherwise loop.
export default function AutoSignIn() {
  // Insurance, not decoration: this is the login path, so it must never be a
  // dead end. If the redirect hasn't happened after a few seconds something
  // silently failed (JS blocked, popup-ish browser weirdness, a hung network),
  // and a manual button is the only way out.
  const [stalled, setStalled] = useState(false);

  useEffect(() => {
    signIn('authentik', { callbackUrl: '/auth/redirect' });
    const timer = setTimeout(() => setStalled(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4" aria-live="polite">
      <div
        className="h-6 w-6 animate-spin rounded-full border-2 border-white/25 border-t-white"
        role="status"
        aria-label="Signing you in"
      />
      <p className="text-sm text-white/70">Signing you in…</p>

      {stalled && (
        <button
          type="button"
          onClick={() => signIn('authentik', { callbackUrl: '/auth/redirect' })}
          className="mt-2 rounded-md border border-white/25 px-4 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
        >
          Taking a while — click to sign in
        </button>
      )}
    </div>
  );
}
