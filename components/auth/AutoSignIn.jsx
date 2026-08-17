'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { takeAutoSignInSlot } from '@/lib/sso';

// A full, ordinary sign-in fired on arrival — no `prompt=none`. For the cases
// where we already know the visitor wants into the portal, rather than merely
// wondering whether they could get in.
//
// The distinction matters because the silent probe cannot do this job. It
// can't grant first-time consent, so someone who just created an account gets
// `consent_required` from a session that is perfectly valid, lands back on
// /login and has to click the button they were never supposed to see. A full
// sign-in is silent for anyone who already has an Authentik session and
// completes consent for anyone who doesn't yet.
//
// This was StartSignIn, serving only /auth/start. It takes props now because
// the account-switch flow needs the identical machinery — cooldown slot,
// stall timer, manual fallback — with one parameter changed. Copying it was
// the obvious alternative and the wrong one: every auth component in this repo
// that got duplicated has since drifted, and each drift presented as "login is
// broken" (see lib/home-portal.js, lib/sso.js).
//
// Props:
//   slot      Cooldown key. MUST be unique per entry point — see lib/sso.js
//             for the outage caused by two entry points sharing one.
//   prompt    OIDC `prompt` value. Omitted for an ordinary sign-in; 'login' to
//             force Authentik to re-ask who is at the keyboard.
//
// ## Never redirect out of the cooldown branch
//
// This used to take a `cooldownHref` and `router.replace()` to it. That is a
// loop waiting to happen: the guard fires precisely when something upstream is
// already bouncing the browser around, and redirecting hands control back to
// whatever page happens to sit at the other end — which may well offer a way
// straight back in. Stopping dead and making a human press a button breaks a
// loop of any shape, which an automatic redirect can never promise.
export default function AutoSignIn({ slot, prompt }) {
  const [stalled, setStalled] = useState(false);
  const [loopGuarded, setLoopGuarded] = useState(false);

  function startSignIn() {
    signIn('authentik', { callbackUrl: '/auth/redirect' }, prompt ? { prompt } : undefined);
  }

  useEffect(() => {
    // A held slot means this same entry point ran moments ago, which is the
    // signature of a redirect loop rather than a person. Stop and hand over.
    if (!takeAutoSignInSlot(slot)) {
      setLoopGuarded(true);
      return undefined;
    }

    startSignIn();

    const timer = setTimeout(() => setStalled(true), 6000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot, prompt]);

  if (loopGuarded) {
    return (
      <div className="flex flex-col items-center gap-4 text-center" aria-live="polite">
        <p className="text-sm leading-relaxed text-white/70">
          Sign-in came back here without finishing. Rather than trying again on
          a loop, we&apos;ve stopped so you can pick what happens next.
        </p>

        <button
          type="button"
          onClick={startSignIn}
          className="w-full rounded-xl border border-[#f0d060] bg-[#d4af37] px-4 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-[#1a1a1a] shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-[#f0d060]"
        >
          Try signing in again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-black/10 px-4 py-6" aria-live="polite">
      <div
        className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-[#d4af37]"
        role="status"
        aria-label="Signing you in"
      />
      <p className="text-sm text-white/70">Signing you in…</p>

      {stalled && (
        <button
          type="button"
          onClick={startSignIn}
          className="mt-2 rounded-xl border border-white/20 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
        >
          Taking a while? Click to continue
        </button>
      )}
    </div>
  );
}
