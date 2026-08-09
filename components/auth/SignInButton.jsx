'use client';

import { signIn } from 'next-auth/react';
import { clearProbeMark } from '@/lib/sso';

// `variant` only decides whether this is the loudest button on the page. On
// /login it usually is; after a sign-out that exists purely to let someone
// create a rush account, "continue to signup" is, and two primary buttons
// would just make the visitor guess.
export default function SignInButton({ variant = 'primary' }) {
  function startSignIn() {
    // Deliberate click, so anything that goes wrong from here is a real
    // failure and should be reported as one — drop any leftover probe mark
    // that would otherwise suppress the error banner.
    clearProbeMark();
    signIn('authentik', { callbackUrl: '/auth/redirect' });
  }

  return (
    <button
      type="button"
      onClick={startSignIn}
      className={
        variant === 'secondary'
          ? 'w-full rounded-md border border-white/25 py-3 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white/10'
          : 'w-full bg-[#2A5CCA] hover:bg-[#3570DB] text-white font-semibold tracking-wider py-3 rounded-md uppercase transition-colors shadow-lg'
      }
    >
      Sign in with KTP SSO
    </button>
  );
}
