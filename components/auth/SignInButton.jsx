'use client';

import { signIn } from 'next-auth/react';
import { clearProbeMark } from '@/lib/sso';

export default function SignInButton() {
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
      className="w-full rounded-xl border border-[#f0d060] bg-[#d4af37] px-4 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-[#1a1a1a] shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-[#f0d060]"
    >
      Sign in with KTP SSO
    </button>
  );
}
