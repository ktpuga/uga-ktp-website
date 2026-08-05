'use client';

import { signIn } from 'next-auth/react';
import { clearEntryMarks } from '@/lib/sso';

export default function SignInButton() {
  function startSignIn() {
    // Deliberate click, so anything that goes wrong from here is a real
    // failure and should be reported as one — drop any leftover probe mark
    // that would otherwise suppress the error banner.
    clearEntryMarks();
    signIn('authentik', { callbackUrl: '/auth/redirect' });
  }

  return (
    <button
      type="button"
      onClick={startSignIn}
      className="w-full bg-[#2A5CCA] hover:bg-[#3570DB] text-white font-semibold tracking-wider py-3 rounded-md uppercase transition-colors shadow-lg"
    >
      Sign in with KTP SSO
    </button>
  );
}
