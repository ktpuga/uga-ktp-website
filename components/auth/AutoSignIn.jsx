'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
//   slot         Cooldown key. MUST be unique per entry point — see lib/sso.js
//                for the outage caused by two entry points sharing one.
//   prompt       OIDC `prompt` value. Omitted for an ordinary sign-in;
//                'login' to force Authentik to re-ask who is at the keyboard.
//   cooldownHref Where to go if the cooldown says this entry point just ran,
//                which means we're in a redirect loop. Omit it when there is
//                nowhere safer to send them — the manual button is shown
//                instead, which breaks the loop just as well because it takes
//                a human to press.
export default function AutoSignIn({ slot, prompt, cooldownHref }) {
  const router = useRouter();
  const [stalled, setStalled] = useState(false);
  const [loopGuarded, setLoopGuarded] = useState(false);

  useEffect(() => {
    if (!takeAutoSignInSlot(slot)) {
      if (cooldownHref) {
        router.replace(cooldownHref);
        return undefined;
      }
      setLoopGuarded(true);
      return undefined;
    }

    signIn('authentik', { callbackUrl: '/auth/redirect' }, prompt ? { prompt } : undefined);

    const timer = setTimeout(() => setStalled(true), 6000);
    return () => clearTimeout(timer);
  }, [router, slot, prompt, cooldownHref]);

  const showButton = stalled || loopGuarded;

  return (
    <div className="flex flex-col items-center gap-4" aria-live="polite">
      {!loopGuarded && (
        <>
          <div
            className="h-6 w-6 animate-spin rounded-full border-2 border-white/25 border-t-white"
            role="status"
            aria-label="Signing you in"
          />
          <p className="text-sm text-white/70">Signing you in…</p>
        </>
      )}

      {showButton && (
        <button
          type="button"
          onClick={() =>
            signIn('authentik', { callbackUrl: '/auth/redirect' }, prompt ? { prompt } : undefined)
          }
          className="mt-2 rounded-md border border-white/25 px-4 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
        >
          {loopGuarded ? 'Continue to sign in' : 'Taking a while — click to continue'}
        </button>
      )}
    </div>
  );
}
