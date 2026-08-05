'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { takeAutoSignInSlot } from '@/lib/sso';

// A full, ordinary sign-in — no `prompt=none`. For the case where we already
// know the visitor wants into the portal, rather than merely wondering whether
// they could get in.
//
// The distinction matters because the silent probe cannot do this job. It
// can't grant first-time consent, so someone who just created an account gets
// `consent_required` from a session that is perfectly valid, lands back on
// /login and has to click the button they were never supposed to see. A full
// sign-in is silent for anyone who already has an Authentik session and
// completes consent for anyone who doesn't yet.
export default function StartSignIn() {
  const router = useRouter();
  const [stalled, setStalled] = useState(false);

  useEffect(() => {
    // Shared with the /login probe, so the two can't ping-pong: whichever ran
    // first holds the slot, and the other falls back to showing options.
    if (!takeAutoSignInSlot()) {
      router.replace('/login');
      return undefined;
    }

    signIn('authentik', { callbackUrl: '/auth/redirect' });

    const timer = setTimeout(() => setStalled(true), 6000);
    return () => clearTimeout(timer);
  }, [router]);

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
          Taking a while — click to continue
        </button>
      )}
    </div>
  );
}
